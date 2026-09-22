import { Link } from 'react-router-dom'
import { useDreamPosts } from '../../context/DreamPostContext'

export default function DreamFeed() {
  const { dreams, loading, error } = useDreamPosts()

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-semibold text-moon-100">Dream Feed</h1>
        <Link
          to="/dreams/new"
          className="rounded-full bg-nebula-500 px-4 py-2 text-sm font-medium text-white hover:bg-nebula-400"
        >
          Post a dream
        </Link>
      </div>

      {loading && <p className="text-moon-400">Loading dreams...</p>}
      {error && <p className="text-sm text-rose-400">{error}</p>}
      {!loading && !error && dreams.length === 0 && (
        <p className="text-moon-400">No dreams posted yet. Be the first to share one.</p>
      )}

      <ul className="space-y-4">
        {dreams.map((dream) => (
          <li
            key={dream.id}
            className="rounded-xl border border-midnight-700 bg-midnight-900/60 p-5"
          >
            <h2 className="text-lg font-semibold text-moon-100">{dream.title}</h2>
            <p className="mt-2 whitespace-pre-wrap text-moon-300">{dream.body}</p>
            <p className="mt-3 text-xs text-moon-500">
              {dream.authorName} &middot; {new Date(dream.createdAt).toLocaleString()}
            </p>
          </li>
        ))}
      </ul>
    </div>
  )
}
