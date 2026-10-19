import { Link } from 'react-router-dom'
import { formatDreamDate, weekdayIndex } from '../../lib/dates'
import type { Thought } from '../../types/thought'
import { KIND_COLORS } from './kindColors'

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

/** A thought on the notebook's timeline: the date in the margin, the entry beside it. */
export default function ThoughtEntry({ thought }: { thought: Thought }) {
  const kind = thought.kind ? KIND_COLORS[thought.kind] : null
  return (
    <li className="group relative grid grid-cols-[3.25rem_1fr] gap-4 sm:grid-cols-[4rem_1fr] sm:gap-6">
      <div className="pt-4 text-right">
        <p className="font-serif text-2xl leading-none text-moon-100 tabular-nums sm:text-3xl">
          {Number(thought.writtenOn.slice(8))}
        </p>
        <p className="mt-1 text-[11px] tracking-widest text-moon-500 uppercase">
          {WEEKDAYS[weekdayIndex(thought.writtenOn)]}
        </p>
      </div>

      <article className="relative rounded-2xl border border-midnight-700/60 bg-gradient-to-br from-midnight-900/90 via-midnight-900/60 to-midnight-800/30 p-4 transition duration-300 group-hover:-translate-y-0.5 group-hover:border-nebula-400/40 group-hover:shadow-[0_12px_40px_-12px_rgba(124,92,255,0.35)] sm:p-5">
        <span
          className={`absolute top-6 -left-[0.8125rem] size-2.5 rounded-full ring-4 ring-midnight-950 sm:-left-[1.0625rem] ${
            kind?.dot ?? 'bg-moon-500'
          }`}
          aria-hidden
        />
        <p className={`text-[11px] font-medium tracking-[0.2em] uppercase ${kind?.text ?? 'text-moon-500'}`}>
          {thought.kind ?? 'Note'}
        </p>
        {/* The link's ::after covers the card, so a tap anywhere opens the thought. */}
        <Link
          to={`/thoughts/${thought.id}`}
          aria-label={`${thought.title}, ${formatDreamDate(thought.writtenOn)}`}
          className="after:absolute after:inset-0 after:rounded-2xl after:content-['']"
        >
          <h3 className="mt-2 font-serif text-xl break-words text-moon-100 transition-colors group-hover:text-nebula-200">
            {thought.title}
          </h3>
        </Link>
        <p className="mt-2 line-clamp-3 text-sm leading-relaxed break-words whitespace-pre-wrap text-moon-300">
          {thought.body}
        </p>
        {thought.tags.length > 0 && (
          <ul className="mt-3 flex flex-wrap gap-x-3 gap-y-1" aria-label="Tags">
            {thought.tags.map((tag) => (
              <li key={tag} className="text-xs text-moon-400 before:mr-1 before:text-nebula-400/70 before:content-['#']">
                {tag}
              </li>
            ))}
          </ul>
        )}
      </article>
    </li>
  )
}
