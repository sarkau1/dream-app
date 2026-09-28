import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { friendlyError } from '../lib/errors'
import { isSupabaseConfigured, NOT_CONFIGURED_ERROR, supabase } from '../lib/supabaseClient'
import { useAuth } from './useAuth'
import { DreamPostContext, type DreamPostContextValue } from './useDreamPosts'
import {
  byCreatedAtDesc,
  byDreamtOnDesc,
  DREAMS_VIEW,
  fetchSharedPage,
  FULL_COLUMNS,
  matchesFilter,
  SUMMARY_COLUMNS,
  summarize,
  toPost,
  toRow,
  toSummary,
  withKnownCounts,
  WRITE_COLUMNS,
} from '../lib/dreamRows'
import {
  ALL_DREAMS_FILTER,
  type DreamInput,
  type DreamPost,
  type DreamSummary,
  type ExportedDream,
  type FeedFilter,
} from '../types/dream'

const LOGGED_OUT_ERROR = 'Log in to read dreams.'
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
  const [feedFilter, setFeedFilter] = useState<FeedFilter>(ALL_DREAMS_FILTER)
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
  const feedFilterRef = useRef(feedFilter)
  const authorNameRef = useRef('Dreamer')
  useEffect(() => {
    hasMoreRef.current = hasMore
    loadingMoreRef.current = loadingMore
    dreamsRef.current = dreams
    feedFilterRef.current = feedFilter
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

    const page = await fetchSharedPage(feedFilter)
    if (gen !== feedGenRef.current) return

    if (page.error) {
      setError(friendlyError(page.error.message))
      setLoading(false)
      return
    }

    setDreams(page.dreams)
    setHasMore(page.hasMore)
    setLoading(false)
  }, [userId, authLoading, feedFilter])

  const loadMore = useCallback(async () => {
    const loaded = dreamsRef.current
    if (!isSupabaseConfigured || !userId || loadingMoreRef.current || !hasMoreRef.current) return
    if (loaded.length === 0) return

    const gen = feedGenRef.current
    setLoadingMore(true)
    const page = await fetchSharedPage(feedFilterRef.current, {
      before: loaded[loaded.length - 1].createdAt,
    })
    if (gen !== feedGenRef.current) return

    if (page.error) {
      setError(friendlyError(page.error.message))
      setLoadingMore(false)
      return
    }

    setDreams((prev) => {
      const seen = new Set(prev.map((dream) => dream.id))
      return [...prev, ...page.dreams.filter((dream) => !seen.has(dream.id))]
    })
    setHasMore(page.hasMore)
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
      const previous = prev.find((dream) => dream.id === post.id)
      const rest = prev.filter((dream) => dream.id !== post.id)
      if (post.isPrivate || !matchesFilter(post, feedFilterRef.current)) return rest
      // Only slot it in if it falls inside the loaded range; otherwise "Load more" will reach it.
      const oldestLoaded = prev[prev.length - 1]?.createdAt
      if (hasMoreRef.current && oldestLoaded && post.createdAt < oldestLoaded) return rest
      return [...rest, withKnownCounts(post, previous)].sort(byCreatedAtDesc)
    })
  }, [])

  // The dream page reports comment and reaction changes here, so going back to the feed shows
  // them without a reload.
  const updateFeedCounts = useCallback(
    (id: string, counts: Pick<DreamPost, 'commentCount' | 'reactionCount' | 'reactedByMe'>) => {
      setDreams((prev) =>
        prev.map((dream) => (dream.id === id ? { ...dream, ...counts } : dream)),
      )
    },
    [],
  )

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

    const [dreamsResult, notesResult] = await Promise.all([
      supabase
        .from(DREAMS_VIEW)
        .select(FULL_COLUMNS)
        .eq('user_id', userId)
        .order('dreamt_on', { ascending: true })
        .order('created_at', { ascending: true }),
      // The private notes are the user's data too, so they go in the export with their dreams.
      supabase.from('dream_notes').select('dream_id, body').eq('user_id', userId),
    ])
    const exportError = dreamsResult.error ?? notesResult.error
    if (exportError) return { dreams: [], error: friendlyError(exportError.message) }

    const notes = new Map(
      ((notesResult.data ?? []) as { dream_id: string; body: string }[]).map((row) => [
        row.dream_id,
        row.body,
      ]),
    )
    const dreams = (dreamsResult.data ?? []).map((row) => {
      const dream: ExportedDream = toPost(row)
      const note = notes.get(dream.id)
      if (note) dream.note = note
      return dream
    })
    return { dreams, error: null }
  }, [userId])

  // Memoized so consumers only re-render when something they can see actually changed.
  const value = useMemo<DreamPostContextValue>(
    () => ({
      dreams,
      loading,
      loadingMore,
      hasMore,
      error,
      feedFilter,
      setFeedFilter,
      refresh,
      loadMore,
      createDream,
      updateDream,
      deleteDream,
      getDream,
      searchMyDreamBodies,
      exportMyDreams,
      updateFeedCounts,
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
      feedFilter,
      setFeedFilter,
      refresh,
      loadMore,
      createDream,
      updateDream,
      deleteDream,
      getDream,
      searchMyDreamBodies,
      exportMyDreams,
      updateFeedCounts,
      myDreams,
      loadingMyDreams,
      myDreamsError,
      refreshMyDreams,
    ],
  )

  return <DreamPostContext.Provider value={value}>{children}</DreamPostContext.Provider>
}
