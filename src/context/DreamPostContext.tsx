import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { isSupabaseConfigured, supabase } from '../lib/supabaseClient'
import { useAuth } from './AuthContext'
import type { DreamInput, DreamMood, DreamPost } from '../types/dream'

const NOT_CONFIGURED_ERROR =
  'This site is not connected to Supabase yet. See README.md to set it up.'
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

interface DreamPostContextValue {
  dreams: DreamPost[]
  loading: boolean
  loadingMore: boolean
  hasMore: boolean
  error: string | null
  refresh: () => Promise<void>
  loadMore: () => Promise<void>
  createDream: (input: DreamInput) => Promise<{ error: string | null }>
  updateDream: (id: string, input: DreamInput) => Promise<{ error: string | null }>
  deleteDream: (id: string) => Promise<{ error: string | null }>
  getDream: (id: string) => Promise<{ dream: DreamPost | null; error: string | null }>
  myDreams: DreamPost[]
  loadingMyDreams: boolean
  myDreamsError: string | null
  refreshMyDreams: () => Promise<void>
}

const DreamPostContext = createContext<DreamPostContextValue | undefined>(undefined)

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
  const pageRef = useRef(0)

  const refreshMyDreams = useCallback(async () => {
    if (!isSupabaseConfigured || !userId) {
      setMyDreams([])
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

    setMyDreamsError(error?.message ?? null)
    if (!error) setMyDreams(await toDreamPosts(data ?? []))
    setLoadingMyDreams(false)
  }, [userId])

  useEffect(() => {
    void refreshMyDreams()
  }, [refreshMyDreams])

  const refresh = useCallback(async () => {
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
    pageRef.current = 0

    const { data: dreamRows, error: dreamsError } = await supabase
      .from('dreams')
      .select(DREAM_COLUMNS)
      .order('created_at', { ascending: false })
      .eq('is_private', false)
      .range(0, PAGE_SIZE - 1)

    if (dreamsError) {
      setError(dreamsError.message)
      setLoading(false)
      return
    }

    setDreams(await toDreamPosts(dreamRows ?? []))
    setHasMore((dreamRows ?? []).length === PAGE_SIZE)
    setLoading(false)
  }, [userId, authLoading])

  const loadMore = useCallback(async () => {
    if (!isSupabaseConfigured || !userId || loadingMore || !hasMore) return

    setLoadingMore(true)
    const nextPage = pageRef.current + 1
    const from = nextPage * PAGE_SIZE
    const { data: dreamRows, error: dreamsError } = await supabase
      .from('dreams')
      .select(DREAM_COLUMNS)
      .order('created_at', { ascending: false })
      .eq('is_private', false)
      .range(from, from + PAGE_SIZE - 1)

    if (dreamsError) {
      setError(dreamsError.message)
      setLoadingMore(false)
      return
    }

    pageRef.current = nextPage
    const newDreams = await toDreamPosts(dreamRows ?? [])
    setDreams((prev) => [...prev, ...newDreams])
    setHasMore((dreamRows ?? []).length === PAGE_SIZE)
    setLoadingMore(false)
  }, [userId, hasMore, loadingMore])

  useEffect(() => {
    void refresh()
  }, [refresh])

  async function createDream(input: DreamInput) {
    if (!isSupabaseConfigured) return { error: NOT_CONFIGURED_ERROR }
    if (!userId) return { error: 'You must be logged in to post a dream.' }

    const { error } = await supabase.from('dreams').insert({ user_id: userId, ...toRow(input) })
    if (error) return { error: error.message }

    await refresh()
    await refreshMyDreams()
    return { error: null }
  }

  async function updateDream(id: string, input: DreamInput) {
    if (!isSupabaseConfigured) return { error: NOT_CONFIGURED_ERROR }
    if (!userId) return { error: 'You must be logged in to edit a dream.' }

    const { error } = await supabase
      .from('dreams')
      .update(toRow(input))
      .eq('id', id)
      .eq('user_id', userId)
    if (error) return { error: error.message }

    await refresh()
    await refreshMyDreams()
    return { error: null }
  }

  async function deleteDream(id: string) {
    if (!isSupabaseConfigured) return { error: NOT_CONFIGURED_ERROR }
    if (!userId) return { error: 'You must be logged in to delete a dream.' }

    const { error } = await supabase.from('dreams').delete().eq('id', id).eq('user_id', userId)
    if (error) return { error: error.message }

    await refresh()
    await refreshMyDreams()
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

export function useDreamPosts() {
  const ctx = useContext(DreamPostContext)
  if (!ctx) throw new Error('useDreamPosts must be used within a DreamPostProvider')
  return ctx
}
