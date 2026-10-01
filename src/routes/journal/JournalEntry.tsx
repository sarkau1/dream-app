import { Link } from 'react-router-dom'
import { formatDreamDate, weekdayIndex } from '../../lib/dates'
import type { DreamMood, DreamSummary } from '../../types/dream'

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

// One colour per mood, used for the timeline dot and the mood label.
const MOOD_COLORS: Record<DreamMood, { dot: string; text: string }> = {
  Lucid: { dot: 'bg-aurora-400 shadow-[0_0_12px_rgba(94,230,200,0.7)]', text: 'text-aurora-300' },
  Nightmare: { dot: 'bg-rose-400 shadow-[0_0_12px_rgba(251,113,133,0.6)]', text: 'text-rose-300' },
  Recurring: { dot: 'bg-amber-300 shadow-[0_0_12px_rgba(252,211,77,0.6)]', text: 'text-amber-200' },
  Peaceful: { dot: 'bg-sky-300 shadow-[0_0_12px_rgba(125,211,252,0.6)]', text: 'text-sky-200' },
  Confusing: { dot: 'bg-nebula-400 shadow-[0_0_12px_rgba(155,127,255,0.7)]', text: 'text-nebula-300' },
}

// Read-only here; whether a dream is shared is changed when editing it.
function Privacy({ dream }: { dream: DreamSummary }) {
  // A shared dream a moderator hid, or shared while you're suspended, isn't in the feed.
  const offFeed = !dream.isPrivate && (dream.hiddenAt || dream.authorSuspended)
  const [icon, label, color, title] = dream.isPrivate
    ? ['🔒', 'Private', 'text-moon-500', undefined]
    : offFeed
      ? [
          '⚠',
          'Hidden',
          'text-rose-300',
          dream.hiddenAt ? 'Hidden from the feed by a moderator' : 'Not in the feed while you’re suspended',
        ]
      : ['◐', 'Shared', 'text-nebula-300', undefined]
  return (
    <span title={title} className={`inline-flex items-center gap-1 text-[11px] tracking-wider uppercase ${color}`}>
      <span aria-hidden>{icon}</span>
      {label}
    </span>
  )
}

/** A dream on the journal's timeline: the date in the margin, the entry beside it. */
export default function JournalEntry({ dream, imageUrl }: { dream: DreamSummary; imageUrl?: string | null }) {
  const mood = dream.mood ? MOOD_COLORS[dream.mood] : null
  return (
    <li className="group relative grid grid-cols-[3.25rem_1fr] gap-4 sm:grid-cols-[4rem_1fr] sm:gap-6">
      {/* The date, beside the timeline. */}
      <div className="pt-4 text-right">
        <p className="font-serif text-2xl leading-none text-moon-100 tabular-nums sm:text-3xl">
          {Number(dream.dreamtOn.slice(8))}
        </p>
        <p className="mt-1 text-[11px] tracking-widest text-moon-500 uppercase">
          {WEEKDAYS[weekdayIndex(dream.dreamtOn)]}
        </p>
      </div>

      <article className="relative rounded-2xl border border-midnight-700/60 bg-gradient-to-br from-midnight-900/90 via-midnight-900/60 to-midnight-800/30 p-4 transition duration-300 group-hover:-translate-y-0.5 group-hover:border-nebula-400/40 group-hover:shadow-[0_12px_40px_-12px_rgba(124,92,255,0.35)] sm:p-5">
        {/* The dot sits on the timeline line drawn by the month section. */}
        <span
          className={`absolute top-6 -left-[0.8125rem] size-2.5 rounded-full ring-4 ring-midnight-950 sm:-left-[1.0625rem] ${
            mood?.dot ?? 'bg-moon-500'
          }`}
          aria-hidden
        />

        <div className="flex items-center justify-between gap-3">
          <p className={`text-[11px] font-medium tracking-[0.2em] uppercase ${mood?.text ?? 'text-moon-500'}`}>
            {dream.mood ?? 'Dream'}
          </p>
          <Privacy dream={dream} />
        </div>

        <div className="flex gap-4">
          <div className="min-w-0 flex-1">
            {/* The link's ::after covers the card, so a tap anywhere opens the dream. */}
            <Link
              to={`/dreams/${dream.id}`}
              aria-label={`${dream.title}, ${formatDreamDate(dream.dreamtOn)}`}
              className="after:absolute after:inset-0 after:rounded-2xl after:content-['']"
            >
              <h3 className="mt-2 font-serif text-xl break-words text-moon-100 transition-colors group-hover:text-nebula-200">
                {dream.title}
              </h3>
            </Link>

            {dream.preview && (
              <p className="mt-2 line-clamp-3 text-sm leading-relaxed break-words whitespace-pre-wrap text-moon-300">
                {dream.preview}
              </p>
            )}

            {dream.symbols.length > 0 && (
              <ul className="mt-3 flex flex-wrap gap-x-3 gap-y-1" aria-label="Symbols">
                {dream.symbols.map((symbol) => (
                  <li key={symbol} className="text-xs text-moon-400 before:mr-1 before:text-nebula-400/70 before:content-['✦']">
                    {symbol}
                  </li>
                ))}
              </ul>
            )}
          </div>
          {/* The picture, once its link is signed; a placeholder keeps the card from jumping. */}
          {dream.imagePath && (
            <div className="mt-2 size-20 shrink-0 overflow-hidden rounded-xl border border-midnight-700/60 bg-midnight-800/60 sm:size-28">
              {imageUrl ? (
                <img
                  src={imageUrl}
                  alt=""
                  loading="lazy"
                  className="size-full object-cover transition duration-500 group-hover:scale-105"
                />
              ) : (
                <div className="size-full animate-pulse" />
              )}
            </div>
          )}
        </div>
      </article>
    </li>
  )
}
