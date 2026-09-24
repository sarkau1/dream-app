import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import type { DreamPost } from '../types/dream'

// Rough check for whether line-clamp-4 is likely to cut the body off.
function isLong(body: string) {
  return body.length > 280 || body.split('\n').length > 4
}

export default function DreamCard({
  dream,
  showAuthor,
  action,
}: {
  dream: DreamPost
  showAuthor: boolean
  action?: ReactNode
}) {
  return (
    <li
      className={`rounded-xl border p-5 ${
        dream.isPrivate
          ? 'border-amber-400/20 bg-gradient-to-br from-midnight-900/80 to-amber-950/20'
          : 'border-midnight-700 bg-midnight-900/60'
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <Link to={`/dreams/${dream.id}`} className="hover:text-nebula-300">
          <h2 className="text-lg font-semibold text-moon-100">{dream.title}</h2>
        </Link>
        {action}
      </div>

      {(dream.mood || dream.symbols.length > 0) && (
        <div className="mt-2 flex flex-wrap gap-2">
          {dream.mood && (
            <span className="rounded-full border border-nebula-400 bg-nebula-500/20 px-2.5 py-0.5 text-xs text-nebula-200">
              {dream.mood}
            </span>
          )}
          {dream.symbols.map((symbol) => (
            <span
              key={symbol}
              className="rounded-full border border-midnight-700 px-2.5 py-0.5 text-xs text-moon-400"
            >
              {symbol}
            </span>
          ))}
        </div>
      )}

      {/* Lists show a preview; the full text lives on the dream's own page. */}
      <p className="mt-2 line-clamp-4 whitespace-pre-wrap text-moon-300">{dream.body}</p>
      {isLong(dream.body) && (
        <Link
          to={`/dreams/${dream.id}`}
          className="mt-1 inline-block text-sm text-nebula-300 hover:text-nebula-200"
        >
          Read more<span className="sr-only">: {dream.title}</span> &rarr;
        </Link>
      )}
      <p className="mt-3 text-xs text-moon-500">
        {showAuthor && <>{dream.authorName} &middot; </>}
        {new Date(dream.createdAt).toLocaleString()}
      </p>
    </li>
  )
}
