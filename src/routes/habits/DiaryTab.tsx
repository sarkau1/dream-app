import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import DreamCardSkeleton from '../../components/DreamCardSkeleton'
import { FormError } from '../../components/TextField'
import { useAuth } from '../../context/useAuth'
import { formatDreamMonth, todayLocal } from '../../lib/dates'
import { fetchThoughts } from '../../lib/thoughtsApi'
import { primaryButtonClass } from '../../styles/ui'
import { THOUGHT_KINDS, type Thought, type ThoughtKind } from '../../types/thought'
import ThoughtEntry from '../thoughts/ThoughtEntry'

const NEW_THOUGHT = '/thoughts/new'
// Cards rendered at first and per "Show more".
const PAGE_SIZE = 30

function mostCommon(values: string[]): string | null {
  const counts = new Map<string, number>()
  for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1)
  let best: string | null = null
  let bestCount = 0
  for (const [value, count] of counts) {
    if (count > bestCount) {
      best = value
      bestCount = count
    }
  }
  return best
}

/** The diary on the Dusk page: thoughts, reading notes and ideas, apart from the dream journal. */
export default function DiaryTab() {
  const userId = useAuth().user?.id ?? null
  const [thoughts, setThoughts] = useState<Thought[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [kind, setKind] = useState<ThoughtKind | null>(null)
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  const needle = query.trim().toLowerCase()

  useEffect(() => {
    if (!userId) return
    let cancelled = false
    void fetchThoughts(userId).then(({ thoughts, error }) => {
      if (cancelled) return
      setThoughts(thoughts)
      setError(error)
    })
    return () => {
      cancelled = true
    }
  }, [userId])

  const all = useMemo(() => thoughts ?? [], [thoughts])

  const stats = useMemo(
    () => ({
      thisMonth: all.filter((t) => t.writtenOn.startsWith(todayLocal().slice(0, 7))).length,
      topKind: mostCommon(all.flatMap((t) => (t.kind ? [t.kind] : []))),
      topTag: mostCommon(all.flatMap((t) => t.tags)),
    }),
    [all],
  )

  const matches = useMemo(
    () =>
      all.filter(
        (t) =>
          (!kind || t.kind === kind) &&
          (!needle || [t.title, t.body, ...t.tags].some((text) => text.toLowerCase().includes(needle))),
      ),
    [all, kind, needle],
  )

  const monthTotals = useMemo(() => {
    const totals = new Map<string, number>()
    for (const t of matches) {
      const month = formatDreamMonth(t.writtenOn)
      totals.set(month, (totals.get(month) ?? 0) + 1)
    }
    return totals
  }, [matches])

  const monthGroups = useMemo(() => {
    const groups = new Map<string, Thought[]>()
    for (const t of matches.slice(0, visibleCount)) {
      const month = formatDreamMonth(t.writtenOn)
      groups.set(month, [...(groups.get(month) ?? []), t])
    }
    return [...groups]
  }, [matches, visibleCount])

  const filterClass = (active: boolean) =>
    `min-h-9 shrink-0 rounded-full px-4 text-sm transition-colors ${
      active ? 'bg-midnight-700 text-moon-100 shadow-inner shadow-black/30' : 'text-moon-500 hover:text-moon-200'
    }`

  const statItems = [
    { label: 'Entries', value: all.length },
    { label: 'This month', value: stats.thisMonth },
    { label: 'Top kind', value: stats.topKind ?? '—' },
    { label: 'Top tag', value: stats.topTag ?? '—' },
  ]

  let content
  if (error) {
    content = <FormError message={error} />
  } else if (thoughts === null) {
    content = <DreamCardSkeleton label="Opening your notebook..." />
  } else if (all.length === 0) {
    content = (
      <div className="rounded-3xl border border-midnight-700/60 bg-gradient-to-b from-midnight-900/80 to-transparent px-6 py-12 text-center">
        <p className="font-serif text-5xl text-amber-200/80" aria-hidden>
          ☀
        </p>
        <p className="mt-4 font-serif text-2xl text-moon-100">Nothing written yet</p>
        <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-moon-400">
          A place for waking thoughts: what you’re reading, ideas, reflections. Kept apart from
          your dreams, and only you can see it.
        </p>
        <Link to={NEW_THOUGHT} className={`mt-6 ${primaryButtonClass}`}>
          Write your first thought
        </Link>
      </div>
    )
  } else {
    content = (
      <>
        <dl className="grid grid-cols-2 divide-midnight-700/70 rounded-2xl border border-midnight-700/60 bg-midnight-900/40 sm:grid-cols-4 sm:divide-x">
          {statItems.map((item) => (
            <div key={item.label} className="px-4 py-3 text-center sm:py-4">
              <dt className="text-[11px] tracking-[0.2em] text-moon-500 uppercase">{item.label}</dt>
              <dd className="mt-1 truncate font-serif text-xl text-moon-100 capitalize">{item.value}</dd>
            </div>
          ))}
        </dl>

        <div className="flex flex-col gap-3">
          <label className="relative">
            <span className="sr-only">Search your thoughts</span>
            <span className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-moon-500" aria-hidden>
              ⌕
            </span>
            <input
              type="search"
              value={query}
              onChange={(event) => {
                setQuery(event.target.value)
                setVisibleCount(PAGE_SIZE)
              }}
              placeholder="Search titles, text, tags…"
              className="min-h-11 w-full rounded-full border border-midnight-700/70 bg-midnight-900/60 py-2 pr-4 pl-10 text-base text-moon-100 placeholder:text-moon-500 transition-colors focus:border-nebula-400/60 focus:ring-2 focus:ring-nebula-400/20 focus:outline-none sm:text-sm"
            />
          </label>
          <div
            role="group"
            aria-label="Filter by kind"
            className="flex overflow-x-auto rounded-full border border-midnight-700/70 bg-midnight-900/60 p-1"
          >
            {[null, ...THOUGHT_KINDS].map((value) => (
              <button
                key={value ?? 'all'}
                type="button"
                aria-pressed={kind === value}
                onClick={() => {
                  setKind(value)
                  setVisibleCount(PAGE_SIZE)
                }}
                className={filterClass(kind === value)}
              >
                {value ?? 'All'}
              </button>
            ))}
          </div>
        </div>

        {monthGroups.length === 0 && (
          <p className="py-8 text-center font-serif text-lg text-moon-400 italic">Nothing matches.</p>
        )}

        {monthGroups.map(([month, monthThoughts]) => (
          <section key={month} className="space-y-4">
            <h2 className="flex items-baseline gap-3">
              <span className="font-serif text-2xl text-moon-100">{month}</span>
              <span className="text-xs tracking-widest text-moon-500 uppercase">
                {monthTotals.get(month)} {monthTotals.get(month) === 1 ? 'entry' : 'entries'}
              </span>
            </h2>
            <ul className="relative space-y-4 before:absolute before:top-2 before:bottom-2 before:left-[3.75rem] before:w-px before:bg-gradient-to-b before:from-amber-300/50 before:via-midnight-600 before:to-transparent sm:before:left-[4.75rem]">
              {monthThoughts.map((thought) => (
                <ThoughtEntry key={thought.id} thought={thought} />
              ))}
            </ul>
          </section>
        ))}

        {matches.length > visibleCount && (
          <button
            type="button"
            onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}
            className="min-h-11 w-full rounded-full border border-midnight-700/70 text-sm text-moon-400 transition-colors hover:border-nebula-400/40 hover:text-moon-100"
          >
            Show more ({matches.length - visibleCount} left)
          </button>
        )}
      </>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-moon-400">Reading notes, ideas and reflections. Only you can see them.</p>
        <Link to={NEW_THOUGHT} className={`shrink-0 ${primaryButtonClass}`}>
          <span aria-hidden>✎</span> Write
        </Link>
      </div>

      {content}
    </div>
  )
}
