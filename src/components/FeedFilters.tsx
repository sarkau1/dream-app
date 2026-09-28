import { fieldClass } from '../styles/ui'
import { DREAM_MOODS, type DreamMood, type FeedFilter, type FeedPeriod } from '../types/dream'

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

/** Mood chips and a "dreamt within" menu, for lists of shared dreams. */
export default function FeedFilters({
  filter,
  onChange,
}: {
  filter: FeedFilter
  onChange: (filter: FeedFilter) => void
}) {
  const setMood = (mood: DreamMood | null) => onChange({ ...filter, mood })

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div role="group" aria-label="Filter by mood" className="flex flex-wrap gap-2">
        <button
          type="button"
          aria-pressed={filter.mood === null}
          onClick={() => setMood(null)}
          className={chipClass(filter.mood === null)}
        >
          All
        </button>
        {DREAM_MOODS.map((mood) => (
          <button
            key={mood}
            type="button"
            aria-pressed={filter.mood === mood}
            onClick={() => setMood(filter.mood === mood ? null : mood)}
            className={chipClass(filter.mood === mood)}
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
        value={filter.period}
        onChange={(e) => onChange({ ...filter, period: e.target.value as FeedPeriod })}
        className={`py-1.5 sm:ml-auto ${fieldClass}`}
      >
        {PERIODS.map((period) => (
          <option key={period.value} value={period.value}>
            {period.label}
          </option>
        ))}
      </select>
    </div>
  )
}
