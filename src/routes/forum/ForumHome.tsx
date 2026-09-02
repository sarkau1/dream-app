import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useForum } from '../../context/ForumContext'
import { FORUM_CATEGORIES, type ForumCategory } from '../../types/forum'

export default function ForumHome() {
  const { threads } = useForum()
  const [activeCategory, setActiveCategory] = useState<ForumCategory | 'All'>('All')

  const filtered = useMemo(() => {
    const sorted = [...threads].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
    return activeCategory === 'All' ? sorted : sorted.filter((t) => t.category === activeCategory)
  }, [threads, activeCategory])

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-moon-100">Forum</h1>
          <p className="mt-2 text-moon-300">Techniques, dream reports, and questions from the community.</p>
        </div>
        <Link
          to="/forum/new"
          className="shrink-0 rounded-full bg-nebula-500 px-4 py-2 text-sm font-medium text-white hover:bg-nebula-400"
        >
          New thread
        </Link>
      </div>

      <div className="flex flex-wrap gap-2">
        {(['All', ...FORUM_CATEGORIES] as const).map((category) => (
          <button
            key={category}
            onClick={() => setActiveCategory(category)}
            className={`rounded-full px-3 py-1 text-sm transition-colors ${
              activeCategory === category
                ? 'bg-nebula-500/20 text-nebula-300'
                : 'bg-midnight-900/60 text-moon-300 hover:text-moon-100'
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      <ul className="space-y-3">
        {filtered.map((thread) => (
          <li key={thread.id}>
            <Link
              to={`/forum/${thread.id}`}
              className="block rounded-2xl border border-midnight-700 bg-midnight-900/60 p-5 transition-colors hover:border-nebula-400/60 hover:bg-midnight-800/60"
            >
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-lg font-medium text-moon-100">{thread.title}</h2>
                <span className="shrink-0 rounded-full bg-midnight-700 px-2 py-0.5 text-xs text-moon-300">
                  {thread.category}
                </span>
              </div>
              <p className="mt-1 text-sm text-moon-500">
                {thread.posts.length} {thread.posts.length === 1 ? 'post' : 'posts'} · started by{' '}
                {thread.posts[0]?.author}
              </p>
            </Link>
          </li>
        ))}
        {filtered.length === 0 && (
          <p className="text-moon-500">No threads in this category yet.</p>
        )}
      </ul>
    </div>
  )
}
