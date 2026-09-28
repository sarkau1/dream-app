import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import Avatar from '../../components/Avatar'
import DreamCard from '../../components/DreamCard'
import DreamCardSkeleton from '../../components/DreamCardSkeleton'
import FeedFilters from '../../components/FeedFilters'
import { FormError } from '../../components/TextField'
import { useAuth } from '../../context/useAuth'
import { fetchDreamer, type Dreamer } from '../../lib/dreamers'
import { fetchSharedPage, isFiltered } from '../../lib/dreamRows'
import { friendlyError } from '../../lib/errors'
import { useDocumentTitle } from '../../lib/useDocumentTitle'
import { cardClass } from '../../styles/ui'
import { ALL_DREAMS_FILTER, type DreamPost, type FeedFilter } from '../../types/dream'

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <dt className="text-xs text-moon-500">{label}</dt>
      <dd className="mt-0.5 font-semibold text-moon-100">{value}</dd>
    </div>
  )
}

function formatMonth(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
}

/** Everything a dreamer has shared, with a few numbers about it. */
export default function DreamerPage() {
  const { userId = '' } = useParams<{ userId: string }>()
  const { user } = useAuth()
  // Tagged with the id it was loaded for, so moving to another dreamer's page shows loading
  // instead of the previous dreamer.
  const [loaded, setLoaded] = useState<{ userId: string; dreamer: Dreamer | null } | null>(null)
  const dreamer = loaded?.userId === userId ? loaded.dreamer : null
  const [filter, setFilter] = useState<FeedFilter>(ALL_DREAMS_FILTER)
  // Tagged with what they were loaded for, so an answer for an earlier filter or dreamer is
  // never shown and "loading" is simply "the list isn't for what's asked yet".
  const [list, setList] = useState<{ key: string; dreams: DreamPost[]; hasMore: boolean } | null>(
    null,
  )
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const isMe = user?.id === userId
  const listKey = `${userId}:${filter.mood}:${filter.period}`
  useDocumentTitle(dreamer?.displayName ?? 'Dreamer')

  useEffect(() => {
    let cancelled = false
    fetchDreamer(userId).then((result) => {
      if (cancelled) return
      setLoaded({ userId, dreamer: result.dreamer })
      setError(result.error)
    })
    return () => {
      cancelled = true
    }
  }, [userId])

  useEffect(() => {
    let cancelled = false
    fetchSharedPage(filter, { userId }).then((page) => {
      if (cancelled) return
      if (page.error) setError(friendlyError(page.error.message))
      setList({ key: listKey, dreams: page.dreams, hasMore: page.hasMore })
    })
    return () => {
      cancelled = true
    }
  }, [userId, filter, listKey])

  async function loadMore() {
    if (!list || list.dreams.length === 0) return
    setLoadingMore(true)
    const page = await fetchSharedPage(filter, {
      userId,
      before: list.dreams[list.dreams.length - 1].createdAt,
    })
    setLoadingMore(false)
    if (page.error) {
      setError(friendlyError(page.error.message))
      return
    }
    setList((prev) =>
      prev && prev.key === listKey
        ? { ...prev, dreams: [...prev.dreams, ...page.dreams], hasMore: page.hasMore }
        : prev,
    )
  }

  if (loaded?.userId !== userId) return <DreamCardSkeleton count={2} label="Loading dreamer..." />

  if (!dreamer) {
    return (
      <div className="space-y-4">
        <FormError message={error} />
        {!error && <p className="text-moon-300">This dreamer couldn’t be found.</p>}
        <Link to="/dreams" className="text-nebula-300 hover:underline">
          Back to Dream Feed
        </Link>
      </div>
    )
  }

  const current = list?.key === listKey ? list : null

  return (
    <div className="max-w-2xl space-y-6">
      <Link to="/dreams" className="text-sm text-moon-500 hover:text-nebula-300">
        &larr; Back to Dream Feed
      </Link>

      <section className={`space-y-5 p-6 ${cardClass}`}>
        <div className="flex items-center gap-4">
          <Avatar userId={dreamer.userId} name={dreamer.displayName} large />
          <div className="min-w-0">
            <h1 className="truncate text-2xl font-semibold text-moon-100">{dreamer.displayName}</h1>
            {dreamer.sharingSince && (
              <p className="text-sm text-moon-400">
                Sharing dreams since {formatMonth(dreamer.sharingSince)}
              </p>
            )}
          </div>
        </div>

        <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <Stat label="Dreams shared" value={dreamer.sharedCount} />
          <Stat label="Lucid dreams" value={dreamer.lucidCount} />
          <div className="col-span-2 sm:col-span-1">
            <dt className="text-xs text-moon-500">Top dream signs</dt>
            <dd className="mt-1 flex flex-wrap gap-1.5">
              {dreamer.topSigns.length > 0 ? (
                dreamer.topSigns.map((sign) => (
                  <span
                    key={sign}
                    className="rounded-full border border-midnight-700 px-2.5 py-0.5 text-xs text-moon-300"
                  >
                    {sign}
                  </span>
                ))
              ) : (
                <span className="text-sm text-moon-500">—</span>
              )}
            </dd>
          </div>
        </dl>

        {isMe && (
          <p className="rounded-lg border border-nebula-400/20 bg-nebula-500/5 px-3 py-2 text-sm text-moon-400">
            This is how other dreamers see you: only your shared dreams show here. Change your name
            on your{' '}
            <Link to="/profile" className="text-nebula-300 hover:text-nebula-200">
              profile
            </Link>
            .
          </p>
        )}
      </section>

      <FeedFilters filter={filter} onChange={setFilter} />
      <FormError message={error} />

      {!current ? (
        <DreamCardSkeleton label="Loading dreams..." />
      ) : current.dreams.length === 0 ? (
        <p className="text-moon-400">
          {isFiltered(filter) ? (
            <>
              No dreams match these filters.{' '}
              <button
                type="button"
                onClick={() => setFilter(ALL_DREAMS_FILTER)}
                className="text-nebula-300 hover:text-nebula-200"
              >
                Show all
              </button>
            </>
          ) : (
            `${dreamer.displayName} hasn’t shared any dreams yet.`
          )}
        </p>
      ) : (
        <ul className="space-y-4">
          {current.dreams.map((dream) => (
            <DreamCard key={dream.id} dream={dream} showAuthor={false} />
          ))}
        </ul>
      )}

      {current?.hasMore && (
        <button
          onClick={loadMore}
          disabled={loadingMore}
          className="w-full rounded-full border border-midnight-700 py-2 text-sm text-moon-300 hover:text-moon-100 disabled:opacity-50"
        >
          {loadingMore ? 'Loading...' : 'Load more'}
        </button>
      )}
    </div>
  )
}
