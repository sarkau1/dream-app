import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { friendlyError } from '../lib/errors'
import { isSupabaseConfigured, NOT_CONFIGURED_ERROR, supabase } from '../lib/supabaseClient'
import { useAuth } from './useAuth'
import { DreamPostContext, type DreamPostContextValue } from './useDreamPosts'
import {
  PREVIEW_LENGTH,
  type DreamInput,
  type DreamMood,
  type DreamPost,
  type DreamSummary,
} from '../types/dream'

const LOGGED_OUT_ERROR = 'Log in to read dreams.'
const PAGE_SIZE = 10

// Reads go through the dreams_with_authors view (supabase/schema.sql), which adds the author's
// display name and a text preview, so a page of dreams is one request. Writes go to `dreams`.
const DREAMS_VIEW = 'dreams_with_authors'
const BASE_COLUMNS = 'id, user_id, title, mood, symbols, is_private, dreamt_on, created_at, author_name'
const FULL_COLUMNS = `${BASE_COLUMNS}, body`
const SUMMARY_COLUMNS = `${BASE_COLUMNS}, preview`
const WRITE_COLUMNS = 'id, user_id, title, body, mood, symbols, is_private, dreamt_on, created_at'

interface BaseRow {
  id: string
  user_id: string
  title: string
  mood: string | null
  symbols: string[] | null
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

function fromBase(row: BaseRow, authorName: string) {
  return {
    id: row.id,
    userId: row.user_id,
    authorName,
    title: row.title,
    mood: (row.mood as DreamMood | null) ?? null,
    symbols: row.symbols ?? [],
    isPrivate: row.is_private,
    dreamtOn: row.dreamt_on,
    createdAt: row.created_at,
  }
}

function toPost(row: BaseRow & { body: string; author_name?: string }, authorName?: string): DreamPost {
  return { ...fromBase(row, authorName ?? row.author_name ?? 'Dreamer'), body: row.body }
}

function toSummary(row: BaseRow & { preview: string; author_name: string }): DreamSummary {
  return { ...fromBase(row, row.author_name), preview: row.preview }
}

function summarize({ body, ...rest }: DreamPost): DreamSummary {
  return { ...rest, preview: body.slice(0, PREVIEW_LENGTH) }
}

// Journal order: by the night dreamt, newest first, then by when it was written down.
function byDreamtOnDesc(a: DreamSummary, b: DreamSummary) {
  if (a.dreamtOn !== b.dreamtOn) return a.dreamtOn < b.dreamtOn ? 1 : -1
  return byCreatedAtDesc(a, b)
}

// Feed order: newest post first.
function byCreatedAtDesc(a: { createdAt: string }, b: { createdAt: string }) {
  return a.createdAt < b.createdAt ? 1 : a.createdAt > b.createdAt ? -1 : 0
}

/** One page of the community feed, newest first; `before` pages past the oldest dream shown. */
function fetchFeedPage(before?: string) {
  let query = supabase.from(DREAMS_VIEW).select(FULL_COLUMNS).eq('is_private', false)
  // Page by "older than the last one shown" rather than by offset, so dreams posted while
  // someone is reading don't shift the pages and show up twice.
  if (before) query = query.lt('created_at', before)
  return query.order('created_at', { ascending: false }).limit(PAGE_SIZE)
}

// ilike treats % and _ as wildcards; a search for "100%" should look for the literal text.
function escapeLike(text: string) {
  return text.replace(/[\\%_]/g, (char) => `\\${char}`)
}

export function DreamPostProvider({ children }: { children: ReactNode }) {
  const { user, profile, loading: authLoading } = useAuth()
  // Depend on the id, not the User object: Supabase hands out a new object on every token refresh,
  // which would otherwise refetch everything and re-trigger effects that depend on getDream.
  const userId = user?.id ?? null
  const [dreams, setDreams] = useState<DreamPost[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [myDreams, setMyDreams] = useState<DreamSummary[]>([])
  const [loadingMyDreams, setLoadingMyDreams] = useState(false)
  const [myDreamsError, setMyDreamsError] = useState<string | null>(null)
  // Bumped on every refresh so a response that arrives after the user changed (e.g. signed out
  // mid-request) or after a newer refresh started is dropped instead of overwriting fresh state.
  const feedGenRef = useRef(0)
  const myDreamsGenRef = useRef(0)
  // Read inside callbacks without making them change identity (which would re-render every
  // consumer and re-run effects keyed on them).
  const hasMoreRef = useRef(hasMore)
  const loadingMoreRef = useRef(loadingMore)
  const dreamsRef = useRef(dreams)
  const authorNameRef = useRef('Dreamer')
  useEffect(() => {
    hasMoreRef.current = hasMore
    loadingMoreRef.current = loadingMore
    dreamsRef.current = dreams
    authorNameRef.current = profile?.displayName ?? 'Dreamer'
  })

  const refreshMyDreams = useCallback(async () => {
    const gen = ++myDreamsGenRef.current
    if (!isSupabaseConfigured || !userId) {
      setMyDreams([])
      setLoadingMyDreams(false)
      return
    }

    setLoadingMyDreams(true)
    // Summaries only: the journal, stats, Essence and Dream Web never need the full text.
    const { data, error } = await supabase
      .from(DREAMS_VIEW)
      .select(SUMMARY_COLUMNS)
      .eq('user_id', userId)
      // The journal is a diary: order by the night dreamt, newest first.
      .order('dreamt_on', { ascending: false })
      .order('created_at', { ascending: false })
    if (gen !== myDreamsGenRef.current) return

    setMyDreamsError(error ? friendlyError(error.message) : null)
    if (!error) setMyDreams((data ?? []).map(toSummary))
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

    const { data, error: feedError } = await fetchFeedPage()
    if (gen !== feedGenRef.current) return

    if (feedError) {
      setError(friendlyError(feedError.message))
      setLoading(false)
      return
    }

    const posts = (data ?? []).map((row) => toPost(row))
    setDreams(posts)
    setHasMore(posts.length === PAGE_SIZE)
    setLoading(false)
  }, [userId, authLoading])

  const loadMore = useCallback(async () => {
    const loaded = dreamsRef.current
    if (!isSupabaseConfigured || !userId || loadingMoreRef.current || !hasMoreRef.current) return
    if (loaded.length === 0) return

    const gen = feedGenRef.current
    setLoadingMore(true)
    const { data, error: feedError } = await fetchFeedPage(loaded[loaded.length - 1].createdAt)
    if (gen !== feedGenRef.current) return

    if (feedError) {
      setError(friendlyError(feedError.message))
      setLoadingMore(false)
      return
    }

    const newDreams = (data ?? []).map((row) => toPost(row))
    setDreams((prev) => {
      const seen = new Set(prev.map((dream) => dream.id))
      return [...prev, ...newDreams.filter((dream) => !seen.has(dream.id))]
    })
    setHasMore(newDreams.length === PAGE_SIZE)
    setLoadingMore(false)
  }, [userId])

  useEffect(() => {
    void refresh()
  }, [refresh])

  // Applies a saved dream to both lists in place, so creating, editing or sharing one doesn't
  // refetch everything and throw away the feed pages already loaded.
  const applySaved = useCallback((post: DreamPost) => {
    setMyDreams((prev) =>
      [...prev.filter((dream) => dream.id !== post.id), summarize(post)].sort(byDreamtOnDesc),
    )
    setDreams((prev) => {
      const rest = prev.filter((dream) => dream.id !== post.id)
      if (post.isPrivate) return rest
      // Only slot it in if it falls inside the loaded range; otherwise "Load more" will reach it.
      const oldestLoaded = prev[prev.length - 1]?.createdAt
      if (hasMoreRef.current && oldestLoaded && post.createdAt < oldestLoaded) return rest
      return [...rest, post].sort(byCreatedAtDesc)
    })
  }, [])

  const createDream = useCallback(
    async (input: DreamInput) => {
      if (!isSupabaseConfigured) return { error: NOT_CONFIGURED_ERROR }
      if (!userId) return { error: 'You must be logged in to post a dream.' }

      const { data, error } = await supabase
        .from('dreams')
        .insert({ user_id: userId, ...toRow(input) })
        .select(WRITE_COLUMNS)
        .single()
      if (error) return { error: friendlyError(error.message) }

      applySaved(toPost(data, authorNameRef.current))
      return { error: null }
    },
    [userId, applySaved],
  )

  const writeDream = useCallback(
    async (id: string, changes: Partial<ReturnType<typeof toRow>>) => {
      if (!isSupabaseConfigured) return { error: NOT_CONFIGURED_ERROR }
      if (!userId) return { error: 'You must be logged in to edit a dream.' }

      const { data, error } = await supabase
        .from('dreams')
        .update(changes)
        .eq('id', id)
        .eq('user_id', userId)
        .select(WRITE_COLUMNS)
        .maybeSingle()
      if (error) return { error: friendlyError(error.message) }
      if (!data) return { error: 'That dream no longer exists.' }

      applySaved(toPost(data, authorNameRef.current))
      return { error: null }
    },
    [userId, applySaved],
  )

  const updateDream = useCallback(
    (id: string, input: DreamInput) => writeDream(id, toRow(input)),
    [writeDream],
  )

  // The journal's share switch only has a summary, so it changes just this one column.
  const setDreamPrivacy = useCallback(
    (id: string, isPrivate: boolean) => writeDream(id, { is_private: isPrivate }),
    [writeDream],
  )

  const deleteDream = useCallback(
    async (id: string) => {
      if (!isSupabaseConfigured) return { error: NOT_CONFIGURED_ERROR }
      if (!userId) return { error: 'You must be logged in to delete a dream.' }

      const { error } = await supabase.from('dreams').delete().eq('id', id).eq('user_id', userId)
      if (error) return { error: friendlyError(error.message) }

      setMyDreams((prev) => prev.filter((dream) => dream.id !== id))
      setDreams((prev) => prev.filter((dream) => dream.id !== id))
      return { error: null }
    },
    [userId],
  )

  const getDream = useCallback(
    async (id: string) => {
      if (!isSupabaseConfigured) return { dream: null, error: NOT_CONFIGURED_ERROR }
      if (!userId) return { dream: null, error: LOGGED_OUT_ERROR }

      const { data, error: fetchError } = await supabase
        .from(DREAMS_VIEW)
        .select(FULL_COLUMNS)
        .eq('id', id)
        .maybeSingle()

      if (fetchError) return { dream: null, error: friendlyError(fetchError.message) }
      return { dream: data ? toPost(data) : null, error: null }
    },
    [userId],
  )

  // Journal search runs over summaries in the browser; this covers the rest of each dream's text.
  const searchMyDreamBodies = useCallback(
    async (query: string) => {
      if (!isSupabaseConfigured || !userId) return { ids: [], error: null }

      const { data, error: searchError } = await supabase
        .from('dreams')
        .select('id')
        .eq('user_id', userId)
        .ilike('body', `%${escapeLike(query)}%`)
      if (searchError) return { ids: [], error: friendlyError(searchError.message) }
      return { ids: (data ?? []).map((row) => row.id as string), error: null }
    },
    [userId],
  )

  // Every dream in full, for the export on the profile page.
  const exportMyDreams = useCallback(async () => {
    if (!isSupabaseConfigured) return { dreams: [], error: NOT_CONFIGURED_ERROR }
    if (!userId) return { dreams: [], error: LOGGED_OUT_ERROR }

    const { data, error: exportError } = await supabase
      .from(DREAMS_VIEW)
      .select(FULL_COLUMNS)
      .eq('user_id', userId)
      .order('dreamt_on', { ascending: true })
      .order('created_at', { ascending: true })
    if (exportError) return { dreams: [], error: friendlyError(exportError.message) }
    return { dreams: (data ?? []).map((row) => toPost(row)), error: null }
  }, [userId])

  // Memoized so consumers only re-render when something they can see actually changed.
  const value = useMemo<DreamPostContextValue>(
    () => ({
      dreams,
      loading,
      loadingMore,
      hasMore,
      error,
      refresh,
      loadMore,
      createDream,
      updateDream,
      setDreamPrivacy,
      deleteDream,
      getDream,
      searchMyDreamBodies,
      exportMyDreams,
      myDreams,
      loadingMyDreams,
      myDreamsError,
      refreshMyDreams,
    }),
    [
      dreams,
      loading,
      loadingMore,
      hasMore,
      error,
      refresh,
      loadMore,
      createDream,
      updateDream,
      setDreamPrivacy,
      deleteDream,
      getDream,
      searchMyDreamBodies,
      exportMyDreams,
      myDreams,
      loadingMyDreams,
      myDreamsError,
      refreshMyDreams,
    ],
  )

  return <DreamPostContext.Provider value={value}>{children}</DreamPostContext.Provider>
}
