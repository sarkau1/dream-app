import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useDreamPosts } from '../../context/useDreamPosts'
import { formatDreamMonth, todayLocal } from '../../lib/dates'
import { useDreamImageUrls } from '../../lib/dreamImages'
import type { DreamSummary } from '../../types/dream'
import { primaryButtonClass } from '../../styles/ui'
import { useDocumentTitle } from '../../lib/useDocumentTitle'
import DreamCardSkeleton from '../../components/DreamCardSkeleton'
import { FormError } from '../../components/TextField'
import JournalEntry from './JournalEntry'

type JournalFilter = 'all' | 'private' | 'shared'

const JOURNAL_FILTERS: { value: JournalFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'private', label: 'Private' },
  { value: 'shared', label: 'Shared' },
]

const NEW_JOURNAL_DREAM = '/dreams/new?from=journal'
// Cards rendered at first and per "Show more", so a years-long journal doesn't render at once.
const PAGE_SIZE = 30
// Wait this long after typing stops before also searching the full text in the database.
const SEARCH_DELAY_MS = 300

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

export default function DreamJournalPage() {
  useDocumentTitle('Journal')
  const { myDreams, loadingMyDreams, myDreamsError, searchMyDreamBodies } = useDreamPosts()
  // ?q= prefills the search, e.g. when a symbol is clicked in the Dream Web.
  const [searchParams] = useSearchParams()
  const [query, setQuery] = useState(() => searchParams.get('q') ?? '')
  const [filter, setFilter] = useState<JournalFilter>('all')
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  // The journal only holds each dream's opening text, so matches deeper in a dream come from
  // the database. Tagged with the query they answer so a stale answer is never applied.
  const [bodyMatches, setBodyMatches] = useState<{ needle: string; ids: Set<string> } | null>(null)
  const needle = query.trim().toLowerCase()

  useEffect(() => {
    if (needle.length < 2) return
    let cancelled = false
    const timer = window.setTimeout(async () => {
      const { ids } = await searchMyDreamBodies(needle)
      if (!cancelled) setBodyMatches({ needle, ids: new Set(ids) })
    }, SEARCH_DELAY_MS)
    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [needle, searchMyDreamBodies])

  const stats = useMemo(
    () => ({
      thisMonth: myDreams.filter((dream) => dream.dreamtOn.startsWith(todayLocal().slice(0, 7))).length,
      topMood: mostCommon(myDreams.flatMap((dream) => (dream.mood ? [dream.mood] : []))),
      topSymbol: mostCommon(
        myDreams.flatMap((dream) => dream.symbols.map((symbol) => symbol.toLowerCase())),
      ),
    }),
    [myDreams],
  )

  const matches = useMemo(() => {
    const deepMatches = bodyMatches?.needle === needle ? bodyMatches.ids : null
    return myDreams.filter(
      (dream) =>
        (filter === 'all' || (filter === 'private') === dream.isPrivate) &&
        (!needle ||
          deepMatches?.has(dream.id) ||
          [dream.title, dream.preview, dream.mood ?? '', ...dream.symbols].some((text) =>
            text.toLowerCase().includes(needle),
          )),
    )
  }, [myDreams, needle, filter, bodyMatches])

  // Counts per month over every match, so a month cut off by "Show more" still shows its total.
  const monthTotals = useMemo(() => {
    const totals = new Map<string, number>()
    for (const dream of matches) {
      const month = formatDreamMonth(dream.dreamtOn)
      totals.set(month, (totals.get(month) ?? 0) + 1)
    }
    return totals
  }, [matches])

  const monthGroups = useMemo(() => {
    const groups = new Map<string, DreamSummary[]>()
    for (const dream of matches.slice(0, visibleCount)) {
      const month = formatDreamMonth(dream.dreamtOn)
      groups.set(month, [...(groups.get(month) ?? []), dream])
    }
    return [...groups]
  }, [matches, visibleCount])

  // Signed once for every picture on screen, rather than one request per card.
  const imageUrls = useDreamImageUrls(monthGroups.flatMap(([, dreams]) => dreams.map((d) => d.imagePath)))

  const filterClass = (value: JournalFilter) =>
    `min-h-9 flex-1 rounded-full px-4 text-sm transition-colors sm:flex-none ${
      filter === value
        ? 'bg-midnight-700 text-moon-100 shadow-inner shadow-black/30'
        : 'text-moon-500 hover:text-moon-200'
    }`

  const statItems = [
    { label: 'Dreams', value: myDreams.length },
    { label: 'This month', value: stats.thisMonth },
    { label: 'Top mood', value: stats.topMood ?? '—' },
    { label: 'Top symbol', value: stats.topSymbol ?? '—' },
  ]

  let content
  if (myDreamsError) {
    content = <FormError message={myDreamsError} />
  } else if (loadingMyDreams && myDreams.length === 0) {
    content = <DreamCardSkeleton label="Opening your journal..." />
  } else if (myDreams.length === 0) {
    content = (
      <div className="rounded-3xl border border-midnight-700/60 bg-gradient-to-b from-midnight-900/80 to-transparent px-6 py-12 text-center">
        <p className="font-serif text-5xl text-nebula-200/80" aria-hidden>
          ☾
        </p>
        <p className="mt-4 font-serif text-2xl text-moon-100">The first page is blank</p>
        <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-moon-400">
          Write a dream down the moment you wake, before it fades. Everything here is private
          unless you choose to share it.
        </p>
        <Link to={NEW_JOURNAL_DREAM} className={`mt-6 ${primaryButtonClass}`}>
          Write your first dream
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

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <label className="relative flex-1">
            <span className="sr-only">Search your journal</span>
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
              placeholder="Search titles, text, moods, symbols…"
              className="min-h-11 w-full rounded-full border border-midnight-700/70 bg-midnight-900/60 py-2 pr-4 pl-10 text-base text-moon-100 placeholder:text-moon-500 transition-colors focus:border-nebula-400/60 focus:ring-2 focus:ring-nebula-400/20 focus:outline-none sm:text-sm"
            />
          </label>
          <div role="group" aria-label="Filter dreams" className="flex rounded-full border border-midnight-700/70 bg-midnight-900/60 p-1">
            {JOURNAL_FILTERS.map(({ value, label }) => (
              <button
                key={value}
                type="button"
                aria-pressed={filter === value}
                onClick={() => {
                  setFilter(value)
                  setVisibleCount(PAGE_SIZE)
                }}
                className={filterClass(value)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {monthGroups.length === 0 && (
          <p className="py-8 text-center font-serif text-lg text-moon-400 italic">No dreams match.</p>
        )}

        {monthGroups.map(([month, monthDreams]) => (
          <section key={month} className="space-y-4">
            <h2 className="flex items-baseline gap-3">
              <span className="font-serif text-2xl text-moon-100">{month}</span>
              <span className="text-xs tracking-widest text-moon-500 uppercase">
                {monthTotals.get(month)} {monthTotals.get(month) === 1 ? 'dream' : 'dreams'}
              </span>
            </h2>
            {/* The timeline: a faint line between the dates and the entries (see JournalEntry). */}
            <ul className="relative space-y-4 before:absolute before:top-2 before:bottom-2 before:left-[3.75rem] before:w-px before:bg-gradient-to-b before:from-nebula-400/50 before:via-midnight-600 before:to-transparent sm:before:left-[4.75rem]">
              {monthDreams.map((dream) => (
                <JournalEntry
                  key={dream.id}
                  dream={dream}
                  imageUrl={dream.imagePath ? imageUrls.get(dream.imagePath) : null}
                />
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
    <div className="mx-auto max-w-3xl space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4 border-b border-midnight-700/60 pb-6">
        <div>
          <p className="text-xs tracking-[0.3em] text-nebula-300/80 uppercase">Sleeping life</p>
          <h1 className="mt-2 font-serif text-4xl text-moon-100 sm:text-5xl">Dream Journal</h1>
          <p className="mt-2 text-sm text-moon-400">Every dream you remember, private by default.</p>
        </div>
        <Link to={NEW_JOURNAL_DREAM} className={`shrink-0 ${primaryButtonClass}`}>
          <span aria-hidden>✎</span> Write a dream
        </Link>
      </header>

      {content}
    </div>
  )
}
