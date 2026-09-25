import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { isSupabaseConfigured, NOT_CONFIGURED_ERROR, supabase } from '../lib/supabaseClient'
import { useAuth } from './useAuth'
import { DreamPostContext } from './useDreamPosts'
import type { DreamInput, DreamMood, DreamPost } from '../types/dream'

const LOGGED_OUT_ERROR = 'Log in to read dreams.'
const PAGE_SIZE = 10

const DREAM_COLUMNS = 'id, user_id, title, body, mood, symbols, is_private, dreamt_on, created_at'

interface DreamRow {
  id: string
  user_id: string
  title: string
  body: string
  mood: string | null
  symbols: string[]
  is_private: boolean
  dreamt_on: string
  created_at: string
}

function toRow(input: DreamInput) {
  return {
    title: input.title,
    body: input.body,
    mood: input.mood,
    symbols: input.symbols,
    is_private: input.isPrivate,
    dreamt_on: input.dreamtOn,
  }
}

async function toDreamPosts(rows: DreamRow[]): Promise<DreamPost[]> {
  const userIds = [...new Set(rows.map((row) => row.user_id))]
  const { data: profileRows } = userIds.length
    ? await supabase.from('profiles').select('user_id, display_name').in('user_id', userIds)
    : { data: [] as { user_id: string; display_name: string }[] }

  const nameByUserId = new Map((profileRows ?? []).map((p) => [p.user_id, p.display_name]))

  return rows.map((row) => ({
    id: row.id,
    userId: row.user_id,
    authorName: nameByUserId.get(row.user_id) ?? 'Dreamer',
    title: row.title,
    body: row.body,
    mood: (row.mood as DreamMood | null) ?? null,
    symbols: row.symbols ?? [],
    isPrivate: row.is_private,
    dreamtOn: row.dreamt_on,
    createdAt: row.created_at,
  }))
}


// Journal order: by the night dreamt, newest first, then by when it was written down.
function byDreamtOnDesc(a: DreamPost, b: DreamPost) {
  if (a.dreamtOn !== b.dreamtOn) return a.dreamtOn < b.dreamtOn ? 1 : -1
  return byCreatedAtDesc(a, b)
}

// Feed order: newest post first.
function byCreatedAtDesc(a: DreamPost, b: DreamPost) {
  return a.createdAt < b.createdAt ? 1 : a.createdAt > b.createdAt ? -1 : 0
}

export function DreamPostProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth()
  // Depend on the id, not the User object: Supabase hands out a new object on every token refresh,
  // which would otherwise refetch everything and re-trigger effects that depend on getDream.
  const userId = user?.id ?? null
  const [dreams, setDreams] = useState<DreamPost[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [myDreams, setMyDreams] = useState<DreamPost[]>([])
  const [loadingMyDreams, setLoadingMyDreams] = useState(false)
  const [myDreamsError, setMyDreamsError] = useState<string | null>(null)
  // Bumped on every refresh so a response that arrives after the user changed (e.g. signed out
  // mid-request) or after a newer refresh started is dropped instead of overwriting fresh state.
  const feedGenRef = useRef(0)
  const myDreamsGenRef = useRef(0)

  const refreshMyDreams = useCallback(async () => {
    const gen = ++myDreamsGenRef.current
    if (!isSupabaseConfigured || !userId) {
      setMyDreams([])
      setLoadingMyDreams(false)
      return
    }

    setLoadingMyDreams(true)
    const { data, error } = await supabase
      .from('dreams')
      .select(DREAM_COLUMNS)
      .eq('user_id', userId)
      // The journal is a diary: order by the night dreamt, newest first.
      .order('dreamt_on', { ascending: false })
      .order('created_at', { ascending: false })
    const posts = error ? [] : await toDreamPosts(data ?? [])
    if (gen !== myDreamsGenRef.current) return

    setMyDreamsError(error?.message ?? null)
    if (!error) setMyDreams(posts)
    setLoadingMyDreams(false)
  }, [userId])

  useEffect(() => {
    void refreshMyDreams()
  }, [refreshMyDreams])

  const refresh = useCallback(async () => {
    const gen = ++feedGenRef.current
    setLoadingMore(false)

    if (!isSupabaseConfigured) {
      setDreams([])
      setError(NOT_CONFIGURED_ERROR)
      setLoading(false)
      return
    }

    // Dreams are only readable by signed-in users (see supabase/schema.sql), so don't query
    // while logged out, and clear anything left over from a previous session.
    if (!userId) {
      setDreams([])
      setHasMore(false)
      setError(null)
      setLoading(authLoading)
      return
    }

    setLoading(true)
    setError(null)

    const { data: dreamRows, error: dreamsError } = await supabase
      .from('dreams')
      .select(DREAM_COLUMNS)
      .order('created_at', { ascending: false })
      .eq('is_private', false)
      .limit(PAGE_SIZE)
    const posts = dreamsError ? [] : await toDreamPosts(dreamRows ?? [])
    if (gen !== feedGenRef.current) return

    if (dreamsError) {
      setError(dreamsError.message)
      setLoading(false)
      return
    }

    setDreams(posts)
    setHasMore(posts.length === PAGE_SIZE)
    setLoading(false)
  }, [userId, authLoading])

  const loadMore = useCallback(async () => {
    if (!isSupabaseConfigured || !userId || loadingMore || !hasMore || dreams.length === 0) return

    const gen = feedGenRef.current
    setLoadingMore(true)
    // Page by "older than the last one shown" rather than by offset, so dreams posted while
    // someone is reading don't shift the pages and show up twice.
    const oldest = dreams[dreams.length - 1].createdAt
    const { data: dreamRows, error: dreamsError } = await supabase
      .from('dreams')
      .select(DREAM_COLUMNS)
      .order('created_at', { ascending: false })
      .eq('is_private', false)
      .lt('created_at', oldest)
      .limit(PAGE_SIZE)
    const newDreams = dreamsError ? [] : await toDreamPosts(dreamRows ?? [])
    if (gen !== feedGenRef.current) return

    if (dreamsError) {
      setError(dreamsError.message)
      setLoadingMore(false)
      return
    }

    setDreams((prev) => {
      const seen = new Set(prev.map((dream) => dream.id))
      return [...prev, ...newDreams.filter((dream) => !seen.has(dream.id))]
    })
    setHasMore(newDreams.length === PAGE_SIZE)
    setLoadingMore(false)
  }, [userId, hasMore, loadingMore, dreams])

  useEffect(() => {
    void refresh()
  }, [refresh])

  // Applies a saved dream to both lists in place, so creating, editing or sharing one doesn't
  // refetch everything and throw away the feed pages already loaded.
  function applySaved(post: DreamPost) {
    setMyDreams((prev) => [...prev.filter((dream) => dream.id !== post.id), post].sort(byDreamtOnDesc))
    setDreams((prev) => {
      const rest = prev.filter((dream) => dream.id !== post.id)
      if (post.isPrivate) return rest
      // Only slot it in if it falls inside the loaded range; otherwise "Load more" will reach it.
      const oldestLoaded = prev[prev.length - 1]?.createdAt
      if (hasMore && oldestLoaded && post.createdAt < oldestLoaded) return rest
      return [...rest, post].sort(byCreatedAtDesc)
    })
  }

  function applyDeleted(id: string) {
    setMyDreams((prev) => prev.filter((dream) => dream.id !== id))
    setDreams((prev) => prev.filter((dream) => dream.id !== id))
  }

  async function createDream(input: DreamInput) {
    if (!isSupabaseConfigured) return { error: NOT_CONFIGURED_ERROR }
    if (!userId) return { error: 'You must be logged in to post a dream.' }

    const { data, error } = await supabase
      .from('dreams')
      .insert({ user_id: userId, ...toRow(input) })
      .select(DREAM_COLUMNS)
      .single()
    if (error) return { error: error.message }

    const [post] = await toDreamPosts([data])
    applySaved(post)
    return { error: null }
  }

  async function updateDream(id: string, input: DreamInput) {
    if (!isSupabaseConfigured) return { error: NOT_CONFIGURED_ERROR }
    if (!userId) return { error: 'You must be logged in to edit a dream.' }

    const { data, error } = await supabase
      .from('dreams')
      .update(toRow(input))
      .eq('id', id)
      .eq('user_id', userId)
      .select(DREAM_COLUMNS)
      .maybeSingle()
    if (error) return { error: error.message }
    if (!data) return { error: 'That dream no longer exists.' }

    const [post] = await toDreamPosts([data])
    applySaved(post)
    return { error: null }
  }

  async function deleteDream(id: string) {
    if (!isSupabaseConfigured) return { error: NOT_CONFIGURED_ERROR }
    if (!userId) return { error: 'You must be logged in to delete a dream.' }

    const { error } = await supabase.from('dreams').delete().eq('id', id).eq('user_id', userId)
    if (error) return { error: error.message }

    applyDeleted(id)
    return { error: null }
  }

  // Memoized because DreamDetailPage fetches in an effect keyed on it.
  const getDream = useCallback(
    async (id: string) => {
      if (!isSupabaseConfigured) return { dream: null, error: NOT_CONFIGURED_ERROR }
      if (!userId) return { dream: null, error: LOGGED_OUT_ERROR }

      const { data, error: fetchError } = await supabase
        .from('dreams')
        .select(DREAM_COLUMNS)
        .eq('id', id)
        .maybeSingle()

      if (fetchError) return { dream: null, error: fetchError.message }
      if (!data) return { dream: null, error: null }

      const [dream] = await toDreamPosts([data])
      return { dream, error: null }
    },
    [userId],
  )

  return (
    <DreamPostContext.Provider
      value={{
        dreams,
        loading,
        loadingMore,
        hasMore,
        error,
        refresh,
        loadMore,
        createDream,
        updateDream,
        deleteDream,
        getDream,
        myDreams,
        loadingMyDreams,
        myDreamsError,
        refreshMyDreams,
      }}
    >
      {children}
    </DreamPostContext.Provider>
  )
}
