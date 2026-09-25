import { Link } from 'react-router-dom'
import DreamCard from '../../components/DreamCard'
import EssenceEarnedNotice from '../../components/EssenceEarnedNotice'
import { useAuth } from '../../context/useAuth'
import { useDreamPosts } from '../../context/useDreamPosts'
import { primaryButtonClass } from '../../styles/ui'
import { useDocumentTitle } from '../../lib/useDocumentTitle'
import DreamCardSkeleton from '../../components/DreamCardSkeleton'
import { FormError } from '../../components/TextField'

export default function DreamFeed() {
  useDocumentTitle('Dream Feed')
  const { user, loading: authLoading } = useAuth()
  const { dreams, loading, loadingMore, hasMore, error, loadMore } = useDreamPosts()

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

      <EssenceEarnedNotice />

      {loading && <DreamCardSkeleton label="Loading dreams..." />}
      <FormError message={error} />
      {!loading && !error && dreams.length === 0 && (
        <p className="text-moon-400">No dreams shared yet. Be the first to share one.</p>
      )}

      <ul className="space-y-4">
        {dreams.map((dream) => (
          <DreamCard key={dream.id} dream={dream} showAuthor />
        ))}
      </ul>

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
