import { Link } from 'react-router-dom'
import DreamCard from '../../components/DreamCard'
import EssenceEarnedNotice from '../../components/EssenceEarnedNotice'
import { useAuth } from '../../context/useAuth'
import { useDreamPosts } from '../../context/useDreamPosts'
import { fieldClass, primaryButtonClass } from '../../styles/ui'
import { useDocumentTitle } from '../../lib/useDocumentTitle'
import DreamCardSkeleton from '../../components/DreamCardSkeleton'
import { FormError } from '../../components/TextField'
import { ALL_DREAMS_FILTER, DREAM_MOODS, type DreamMood, type FeedPeriod } from '../../types/dream'

const PERIODS: { value: FeedPeriod; label: string }[] = [
  { value: 'all', label: 'Any time' },
  { value: 'week', label: 'Past week' },
  { value: 'month', label: 'Past month' },
  { value: 'year', label: 'Past year' },
]

function chipClass(active: boolean) {
  return `rounded-full border px-3.5 py-2 text-sm transition-colors sm:px-3 sm:py-1 sm:text-xs ${
    active
      ? 'border-nebula-400 bg-nebula-500/20 text-nebula-200'
      : 'border-midnight-700 text-moon-400 hover:text-moon-100'
  }`
}

export default function DreamFeed() {
  useDocumentTitle('Dream Feed')
  const { user, loading: authLoading } = useAuth()
  const { dreams, loading, loadingMore, hasMore, error, loadMore, feedFilter, setFeedFilter } =
    useDreamPosts()
  const filtered = feedFilter.mood !== null || feedFilter.period !== 'all'

  if (!authLoading && !user) {
    return (
      <div className="max-w-2xl space-y-4">
        <h1 className="text-3xl font-semibold text-moon-100">Dream Feed</h1>
        <p className="text-moon-400">
          <Link to="/login" className="text-nebula-300 hover:text-nebula-200">
            Log in
          </Link>{' '}
          to read and share dreams.
        </p>
      </div>
    )
  }

  const setMood = (mood: DreamMood | null) => setFeedFilter({ ...feedFilter, mood })

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-moon-100">Dream Feed</h1>
          <p className="mt-1 text-sm text-moon-400">
            Dreams the community chose to share. Your own dreams live in your{' '}
            <Link to="/journal" className="text-nebula-300 hover:text-nebula-200">
              Journal
            </Link>
            .
          </p>
        </div>
        <Link
          to="/dreams/new"
          className={`shrink-0 ${primaryButtonClass}`}
        >
          Share a dream
        </Link>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div role="group" aria-label="Filter by mood" className="flex flex-wrap gap-2">
          <button
            type="button"
            aria-pressed={feedFilter.mood === null}
            onClick={() => setMood(null)}
            className={chipClass(feedFilter.mood === null)}
          >
            All
          </button>
          {DREAM_MOODS.map((mood) => (
            <button
              key={mood}
              type="button"
              aria-pressed={feedFilter.mood === mood}
              onClick={() => setMood(feedFilter.mood === mood ? null : mood)}
              className={chipClass(feedFilter.mood === mood)}
            >
              {mood}
            </button>
          ))}
        </div>
        <label htmlFor="feed-period" className="sr-only">
          Dreamt
        </label>
        <select
          id="feed-period"
          value={feedFilter.period}
          onChange={(e) => setFeedFilter({ ...feedFilter, period: e.target.value as FeedPeriod })}
          className={`py-1.5 sm:ml-auto ${fieldClass}`}
        >
          {PERIODS.map((period) => (
            <option key={period.value} value={period.value}>
              {period.label}
            </option>
          ))}
        </select>
      </div>

      <EssenceEarnedNotice />

      {loading && <DreamCardSkeleton label="Loading dreams..." />}
      <FormError message={error} />
      {!loading && !error && dreams.length === 0 && (
        filtered ? (
          <p className="text-moon-400">
            No dreams match these filters.{' '}
            <button
              type="button"
              onClick={() => setFeedFilter(ALL_DREAMS_FILTER)}
              className="text-nebula-300 hover:text-nebula-200"
            >
              Show all dreams
            </button>
          </p>
        ) : (
          <p className="text-moon-400">No dreams shared yet. Be the first to share one.</p>
        )
      )}

      {!loading && (
        <ul className="space-y-4">
          {dreams.map((dream) => (
            <DreamCard key={dream.id} dream={dream} showAuthor />
          ))}
        </ul>
      )}

      {!loading && hasMore && (
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
