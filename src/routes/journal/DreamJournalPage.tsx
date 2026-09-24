import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import DreamCard from '../../components/DreamCard'
import EssenceEarnedNotice from '../../components/EssenceEarnedNotice'
import { useDreamPosts } from '../../context/DreamPostContext'
import type { DreamPost } from '../../types/dream'

type JournalFilter = 'all' | 'private' | 'shared'

const JOURNAL_FILTERS: { value: JournalFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'private', label: 'Private only' },
  { value: 'shared', label: 'In feed' },
]

const NEW_JOURNAL_DREAM = '/dreams/new?from=journal'

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

function ShareToggle({ dream }: { dream: DreamPost }) {
  const { updateDream } = useDreamPosts()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const shared = !dream.isPrivate

  async function toggle() {
    setSaving(true)
    setError(null)
    const { error } = await updateDream(
      dream.id,
      dream.title,
      dream.body,
      dream.mood,
      dream.symbols,
      shared,
    )
    if (error) setError(error)
    setSaving(false)
  }

  return (
    <div className="flex shrink-0 flex-col items-end gap-1">
      <button
        type="button"
        role="switch"
        aria-checked={shared}
        onClick={toggle}
        disabled={saving}
        title={
          shared
            ? 'Visible in the Dream Feed. Click to make private.'
            : 'Only you can see this. Click to share it in the Dream Feed.'
        }
        className="flex items-center gap-2 text-xs text-moon-400 disabled:opacity-50"
      >
        <span className={shared ? 'text-nebula-200' : 'text-amber-200'}>
          {saving ? 'Saving...' : shared ? 'In feed' : 'Private'}
        </span>
        <span
          className={`relative h-5 w-9 rounded-full transition-colors ${
            shared ? 'bg-nebula-500' : 'bg-amber-400/30'
          }`}
        >
          <span
            className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all ${
              shared ? 'left-[18px]' : 'left-0.5'
            }`}
          />
        </span>
      </button>
      {error && <span className="text-xs text-rose-400">{error}</span>}
    </div>
  )
}

export default function DreamJournalPage() {
  const { myDreams, loadingMyDreams, myDreamsError } = useDreamPosts()
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<JournalFilter>('all')

  const stats = useMemo(
    () => ({
      shared: myDreams.filter((dream) => !dream.isPrivate).length,
      topMood: mostCommon(myDreams.flatMap((dream) => (dream.mood ? [dream.mood] : []))),
      topSymbol: mostCommon(myDreams.flatMap((dream) => dream.symbols)),
    }),
    [myDreams],
  )

  const monthGroups = useMemo(() => {
    const needle = query.trim().toLowerCase()
    const matches = myDreams.filter(
      (dream) =>
        (filter === 'all' || (filter === 'private') === dream.isPrivate) &&
        (!needle ||
          [dream.title, dream.body, dream.mood ?? '', ...dream.symbols].some((text) =>
            text.toLowerCase().includes(needle),
          )),
    )

    const groups = new Map<string, DreamPost[]>()
    for (const dream of matches) {
      const month = new Date(dream.createdAt).toLocaleDateString(undefined, {
        month: 'long',
        year: 'numeric',
      })
      groups.set(month, [...(groups.get(month) ?? []), dream])
    }
    return [...groups]
  }, [myDreams, query, filter])

  const filterClass = (value: JournalFilter) =>
    `rounded-full border px-3 py-1 text-xs transition-colors ${
      filter === value
        ? 'border-amber-400/50 bg-amber-400/10 text-amber-200'
        : 'border-midnight-700 text-moon-400 hover:text-moon-100'
    }`

  let content
  if (myDreamsError) {
    content = <p className="text-sm text-rose-400">{myDreamsError}</p>
  } else if (loadingMyDreams && myDreams.length === 0) {
    content = <p className="text-moon-400">Opening your journal...</p>
  } else if (myDreams.length === 0) {
    content = (
      <div className="rounded-2xl border border-dashed border-amber-400/30 bg-amber-400/5 p-8 text-center">
        <p className="text-4xl" aria-hidden>
          📓
        </p>
        <p className="mt-3 font-medium text-moon-100">Your journal is empty</p>
        <p className="mt-1 text-sm text-moon-400">
          Every dream you write is stored here, private by default. You decide which ones show up
          in the Dream Feed.
        </p>
        <Link
          to={NEW_JOURNAL_DREAM}
          className="mt-4 inline-block rounded-full border border-amber-400/50 px-4 py-2 text-sm text-amber-200 hover:bg-amber-400/10"
        >
          Write your first dream
        </Link>
      </div>
    )
  } else {
    content = (
      <>
        <dl className="grid grid-cols-2 gap-3 text-center sm:grid-cols-4">
          <div className="rounded-xl border border-midnight-700 bg-midnight-900/60 p-3">
            <dt className="text-xs text-moon-500">Dreams</dt>
            <dd className="mt-1 text-lg font-semibold text-moon-100">{myDreams.length}</dd>
          </div>
          <div className="rounded-xl border border-midnight-700 bg-midnight-900/60 p-3">
            <dt className="text-xs text-moon-500">In feed</dt>
            <dd className="mt-1 text-lg font-semibold text-moon-100">{stats.shared}</dd>
          </div>
          <div className="rounded-xl border border-midnight-700 bg-midnight-900/60 p-3">
            <dt className="text-xs text-moon-500">Top mood</dt>
            <dd className="mt-1 truncate text-sm font-medium text-moon-100">
              {stats.topMood ?? '—'}
            </dd>
          </div>
          <div className="rounded-xl border border-midnight-700 bg-midnight-900/60 p-3">
            <dt className="text-xs text-moon-500">Top symbol</dt>
            <dd className="mt-1 truncate text-sm font-medium text-moon-100">
              {stats.topSymbol ?? '—'}
            </dd>
          </div>
        </dl>

        <div className="space-y-3">
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search your journal by title, text, mood or symbol..."
            className="w-full rounded-full border border-midnight-700 bg-midnight-900/60 px-4 py-2 text-sm text-moon-100 placeholder:text-moon-500 focus:border-amber-400/50 focus:outline-none"
          />
          <div role="group" aria-label="Filter dreams" className="flex gap-2">
            {JOURNAL_FILTERS.map(({ value, label }) => (
              <button
                key={value}
                type="button"
                aria-pressed={filter === value}
                onClick={() => setFilter(value)}
                className={filterClass(value)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {monthGroups.length === 0 && <p className="text-moon-400">No dreams match.</p>}

        {monthGroups.map(([month, monthDreams]) => (
          <section key={month} className="space-y-3">
            <h2 className="text-xs font-medium uppercase tracking-wider text-moon-500">
              {month} &middot; {monthDreams.length}
            </h2>
            <ul className="space-y-4">
              {monthDreams.map((dream) => (
                <DreamCard
                  key={dream.id}
                  dream={dream}
                  showAuthor={false}
                  action={<ShareToggle dream={dream} />}
                />
              ))}
            </ul>
          </section>
        ))}
      </>
    )
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-moon-100">Dream Journal</h1>
          <p className="mt-1 text-sm text-moon-400">
            All your dreams, private by default. Flip the switch to share one in the{' '}
            <Link to="/dreams" className="text-nebula-300 hover:text-nebula-200">
              Dream Feed
            </Link>
            .
          </p>
        </div>
        <Link
          to={NEW_JOURNAL_DREAM}
          className="shrink-0 rounded-full bg-nebula-500 px-4 py-2 text-sm font-medium text-white hover:bg-nebula-400"
        >
          Write a dream
        </Link>
      </div>

      <EssenceEarnedNotice />

      {content}
    </div>
  )
}
