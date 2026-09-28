import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { formatDreamDate } from '../lib/dates'
import AuthorByline from './AuthorByline'
import DreamTags from './DreamTags'
import type { DreamPost, DreamSummary } from '../types/dream'

// Rough check for whether line-clamp-4 is likely to cut the body off.
function isLong(body: string) {
  return body.length > 280 || body.split('\n').length > 4
}

export default function DreamCard({
  dream,
  showAuthor,
  action,
}: {
  /** Journal lists pass a summary (preview text only); the feed passes the full dream. */
  dream: DreamPost | DreamSummary
  showAuthor: boolean
  action?: ReactNode
}) {
  const text = 'body' in dream ? dream.body : dream.preview
  return (
    <li
      // relative: the title link stretches over the whole card (see below).
      className={`relative rounded-2xl border p-4 transition-colors sm:p-5 ${
        dream.isPrivate
          ? 'border-amber-400/20 bg-gradient-to-br from-midnight-900/80 to-amber-950/20 hover:border-amber-400/40'
          : 'border-midnight-700/80 bg-midnight-900/60 hover:border-nebula-400/40'
      }`}
    >
      {showAuthor && (
        <div className="mb-3">
          <AuthorByline dream={dream} />
        </div>
      )}

      <div className="flex items-start justify-between gap-4">
        {/* The link's ::after covers the card, so a tap anywhere on it opens the dream while
            screen readers still meet one link. Controls sit above it with z-10. */}
        <Link
          to={`/dreams/${dream.id}`}
          className="group after:absolute after:inset-0 after:rounded-2xl after:content-['']"
        >
          <h2 className="break-words text-lg font-semibold text-moon-100 group-hover:text-nebula-300">
            {dream.title}
          </h2>
        </Link>
        {action && <div className="relative z-10">{action}</div>}
      </div>

      <DreamTags dream={dream} className="mt-2" />

      {/* Lists show a preview; the full text lives on the dream's own page. */}
      <p className="mt-2 line-clamp-4 whitespace-pre-wrap break-words text-moon-300">{text}</p>
      {isLong(text) && (
        <span className="mt-1 inline-block text-sm text-nebula-300" aria-hidden>
          Read more &rarr;
        </span>
      )}
      {/* The byline already carries the date when the author is shown. */}
      {!showAuthor && (
        <p className="mt-3 text-xs text-moon-500">dreamt {formatDreamDate(dream.dreamtOn)}</p>
      )}
      {/* Counts are only loaded for the Dream Feed. */}
      {dream.commentCount !== undefined && (
        <p className="mt-3 flex gap-4 text-xs text-moon-400">
          <span>
            💬 {dream.commentCount} {dream.commentCount === 1 ? 'comment' : 'comments'}
          </span>
          {!!dream.reactionCount && (
            <span className="text-aurora-300">✦ {dream.reactionCount} resonated</span>
          )}
        </p>
      )}
    </li>
  )
}
