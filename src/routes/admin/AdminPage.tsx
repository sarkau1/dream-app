import { useCallback, useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { FormError } from '../../components/TextField'
import { useAuth } from '../../context/useAuth'
import { useDreamPosts } from '../../context/useDreamPosts'
import { deleteComment } from '../../lib/dreamSocial'
import {
  closeReport,
  fetchHiddenDreams,
  fetchOpenReports,
  fetchOverview,
  fetchSuspensions,
  hideDream,
  REPORT_REASONS,
  searchDreamers,
  suspendUser,
  unhideDream,
  unsuspendUser,
  type DreamerMatch,
  type HiddenDream,
  type Overview,
  type Report,
  type Suspension,
} from '../../lib/moderation'
import { useDocumentTitle } from '../../lib/useDocumentTitle'
import { cardClass, fieldClass, secondaryButtonClass } from '../../styles/ui'

const smallButton =
  'rounded-full border border-midnight-700 px-3 py-1 text-xs text-moon-300 hover:text-moon-100 disabled:opacity-50'
const dangerSmallButton =
  'rounded-full border border-rose-500/40 px-3 py-1 text-xs text-rose-300 hover:bg-rose-500/10 disabled:opacity-50'

const OVERVIEW_TILES: { key: keyof Overview; label: string }[] = [
  { key: 'users', label: 'Dreamers' },
  { key: 'new_users_7d', label: 'New this week' },
  { key: 'active_users_7d', label: 'Wrote a dream this week' },
  { key: 'dreams', label: 'Dreams' },
  { key: 'dreams_7d', label: 'Dreams this week' },
  { key: 'lucid_dreams', label: 'Lucid dreams' },
  { key: 'shared_dreams', label: 'Shared dreams' },
  { key: 'comments_7d', label: 'Comments this week' },
  { key: 'open_reports', label: 'Open reports' },
  { key: 'suspended_users', label: 'Suspended' },
  { key: 'hidden_dreams', label: 'Hidden dreams' },
]

const reasonLabel = (reason: string) =>
  REPORT_REASONS.find((option) => option.value === reason)?.label ?? reason

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })

function Section({ title, count, children }: { title: string; count?: number; children: ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-medium text-moon-100">
        {title}
        {count !== undefined && <span className="ml-2 text-sm font-normal text-moon-500">{count}</span>}
      </h2>
      {children}
    </section>
  )
}

function ReportCard({ report, onDone }: { report: Report; onDone: () => Promise<void> }) {
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Runs a moderation action, then closes the report with `outcome`.
  async function act(action: (() => Promise<{ error: string | null }>) | null, outcome: 'resolved' | 'dismissed') {
    setPending(true)
    setError(null)
    const first = action ? await action() : { error: null }
    const closed = first.error ? first : await closeReport(report.id, outcome)
    setPending(false)
    if (closed.error) {
      setError(closed.error)
      return
    }
    await onDone()
  }

  function suspend() {
    const reason = window.prompt(
      `Why suspend ${report.reportedUserName}? They'll see this.`,
      reasonLabel(report.reason),
    )
    if (reason !== null) void act(() => suspendUser(report.reportedUserId, reason), 'resolved')
  }

  return (
    <li className={`space-y-3 p-4 ${cardClass}`}>
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="rounded-full border border-rose-400/40 bg-rose-500/10 px-2 py-0.5 font-medium uppercase tracking-wide text-rose-200">
          {report.kind}
        </span>
        <span className="text-moon-100">{reasonLabel(report.reason)}</span>
        <span className="text-moon-500">
          · reported by {report.reporterName} on {formatDate(report.createdAt)}
        </span>
      </div>

      <p className="text-sm text-moon-300">
        About{' '}
        <Link to={`/dreamers/${report.reportedUserId}`} className="text-nebula-300 hover:text-nebula-200">
          {report.reportedUserName}
        </Link>
        {report.reportedUserSuspended && <span className="ml-2 text-xs text-rose-300">suspended</span>}
      </p>

      {report.kind === 'dream' &&
        (report.dreamTitle ? (
          <Link
            to={`/dreams/${report.dreamId}`}
            className="block rounded-lg border border-midnight-700 bg-midnight-950/40 p-3 hover:border-nebula-400/40"
          >
            <p className="font-medium text-moon-100">
              {report.dreamTitle}
              {report.dreamHidden && <span className="ml-2 text-xs text-rose-300">hidden</span>}
            </p>
            <p className="mt-1 line-clamp-3 text-sm text-moon-400">{report.dreamPreview}</p>
          </Link>
        ) : (
          <p className="text-sm italic text-moon-500">The dream was deleted or made private.</p>
        ))}
      {report.kind === 'comment' &&
        (report.commentBody ? (
          <blockquote className="rounded-lg border-l-2 border-rose-400/50 bg-midnight-950/40 p-3 text-sm text-moon-300">
            {report.commentBody}
            {report.dreamId && (
              <Link to={`/dreams/${report.dreamId}`} className="mt-1 block text-xs text-nebula-300 hover:text-nebula-200">
                Open the dream
              </Link>
            )}
          </blockquote>
        ) : (
          <p className="text-sm italic text-moon-500">The comment was deleted.</p>
        ))}
      {report.details && <p className="text-sm text-moon-400">“{report.details}”</p>}

      <FormError message={error} />
      <div className="flex flex-wrap gap-2">
        {report.kind === 'dream' && report.dreamId && report.dreamTitle && !report.dreamHidden && (
          <button
            type="button"
            disabled={pending}
            onClick={() => act(() => hideDream(report.dreamId!, reasonLabel(report.reason)), 'resolved')}
            className={dangerSmallButton}
          >
            Hide dream
          </button>
        )}
        {report.kind === 'comment' && report.commentId && report.commentBody && (
          <button
            type="button"
            disabled={pending}
            onClick={() => act(() => deleteComment(report.commentId!), 'resolved')}
            className={dangerSmallButton}
          >
            Delete comment
          </button>
        )}
        {!report.reportedUserSuspended && (
          <button type="button" disabled={pending} onClick={suspend} className={dangerSmallButton}>
            Suspend {report.reportedUserName}
          </button>
        )}
        <button type="button" disabled={pending} onClick={() => act(null, 'resolved')} className={smallButton}>
          Mark handled
        </button>
        <button type="button" disabled={pending} onClick={() => act(null, 'dismissed')} className={smallButton}>
          Dismiss
        </button>
      </div>
    </li>
  )
}

function FindDreamer() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<DreamerMatch[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!query.trim()) return
    const result = await searchDreamers(query)
    setResults(result.dreamers)
    setError(result.error)
  }

  return (
    <div className="space-y-3">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <label htmlFor="admin-dreamer-search" className="sr-only">
          Display name
        </label>
        <input
          id="admin-dreamer-search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Display name…"
          className={`min-w-0 flex-1 ${fieldClass}`}
        />
        <button type="submit" className={secondaryButtonClass}>
          Search
        </button>
      </form>
      <FormError message={error} />
      {results &&
        (results.length === 0 ? (
          <p className="text-sm text-moon-500">No dreamers with that name.</p>
        ) : (
          <ul className="space-y-1">
            {results.map((dreamer) => (
              <li key={dreamer.userId}>
                <Link to={`/dreamers/${dreamer.userId}`} className="text-sm text-nebula-300 hover:text-nebula-200">
                  {dreamer.displayName}
                </Link>
              </li>
            ))}
          </ul>
        ))}
    </div>
  )
}

/** Moderation and site numbers, for admins. Never shows anyone's private dreams or notes. */
export default function AdminPage() {
  useDocumentTitle('Admin')
  const { profile } = useAuth()
  const { refresh } = useDreamPosts()
  const isAdmin = profile?.isAdmin === true
  const [overview, setOverview] = useState<Overview | null>(null)
  const [reports, setReports] = useState<Report[] | null>(null)
  const [suspensions, setSuspensions] = useState<Suspension[]>([])
  const [hidden, setHidden] = useState<HiddenDream[]>([])
  const [error, setError] = useState<string | null>(null)
  const [pendingId, setPendingId] = useState<string | null>(null)

  const load = useCallback(async () => {
    const [o, r, s, h] = await Promise.all([
      fetchOverview(),
      fetchOpenReports(),
      fetchSuspensions(),
      fetchHiddenDreams(),
    ])
    setOverview(o.overview)
    setReports(r.reports)
    setSuspensions(s.suspensions)
    setHidden(h.dreams)
    setError(o.error ?? r.error ?? s.error ?? h.error)
  }, [])

  useEffect(() => {
    if (isAdmin) void load()
  }, [isAdmin, load])

  // After any action: reload this page and the feed, which may have gained or lost dreams.
  const reloadAll = useCallback(async () => {
    await load()
    void refresh()
  }, [load, refresh])

  async function run(id: string, action: () => Promise<{ error: string | null }>) {
    setPendingId(id)
    const result = await action()
    setPendingId(null)
    if (result.error) setError(result.error)
    else await reloadAll()
  }

  if (!profile) return <p className="text-moon-400">Loading...</p>
  if (!isAdmin) {
    return (
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold text-moon-100">Admin</h1>
        <p className="text-moon-400">This page is only for the site’s admins.</p>
      </div>
    )
  }

  return (
    <div className="space-y-10">
      <header className="space-y-1">
        <h1 className="text-3xl font-semibold text-moon-100">Admin</h1>
        <p className="text-sm text-moon-400">
          Keep the community side healthy. Private dreams and notes stay private here too.
        </p>
      </header>

      <FormError message={error} />

      <Section title="Overview">
        {overview ? (
          <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
            {OVERVIEW_TILES.map((tile) => (
              <div
                key={tile.key}
                className={`rounded-xl border p-3 ${
                  tile.key === 'open_reports' && overview.open_reports > 0
                    ? 'border-rose-400/40 bg-rose-500/5'
                    : 'border-midnight-700 bg-midnight-900/60'
                }`}
              >
                <dt className="text-xs text-moon-500">{tile.label}</dt>
                <dd className="mt-1 text-xl font-semibold text-moon-100">{overview[tile.key]}</dd>
              </div>
            ))}
          </dl>
        ) : (
          <p className="text-sm text-moon-500">Loading...</p>
        )}
      </Section>

      <Section title="Open reports" count={reports?.length}>
        {reports === null ? (
          <p className="text-sm text-moon-500">Loading...</p>
        ) : reports.length === 0 ? (
          <p className="text-sm text-moon-500">Nothing to review. 🌙</p>
        ) : (
          <ul className="space-y-3">
            {reports.map((report) => (
              <ReportCard key={report.id} report={report} onDone={reloadAll} />
            ))}
          </ul>
        )}
      </Section>

      <div className="grid gap-10 lg:grid-cols-2">
        <Section title="Suspended dreamers" count={suspensions.length}>
          {suspensions.length === 0 ? (
            <p className="text-sm text-moon-500">No one is suspended.</p>
          ) : (
            <ul className="space-y-2">
              {suspensions.map((s) => (
                <li key={s.userId} className={`flex flex-wrap items-center justify-between gap-2 p-3 ${cardClass}`}>
                  <div className="min-w-0">
                    <Link to={`/dreamers/${s.userId}`} className="text-sm font-medium text-nebula-300 hover:text-nebula-200">
                      {s.displayName}
                    </Link>
                    <p className="text-xs text-moon-500">
                      {s.reason} · since {formatDate(s.since)}
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={pendingId === s.userId}
                    onClick={() => run(s.userId, () => unsuspendUser(s.userId))}
                    className={smallButton}
                  >
                    Lift suspension
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Section>

        <Section title="Hidden dreams" count={hidden.length}>
          {hidden.length === 0 ? (
            <p className="text-sm text-moon-500">No dreams are hidden.</p>
          ) : (
            <ul className="space-y-2">
              {hidden.map((dream) => (
                <li key={dream.id} className={`flex flex-wrap items-center justify-between gap-2 p-3 ${cardClass}`}>
                  <div className="min-w-0">
                    <Link to={`/dreams/${dream.id}`} className="text-sm font-medium text-nebula-300 hover:text-nebula-200">
                      {dream.title}
                    </Link>
                    <p className="text-xs text-moon-500">
                      by {dream.authorName}
                      {dream.hiddenReason && ` · ${dream.hiddenReason}`} · {formatDate(dream.hiddenAt)}
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={pendingId === dream.id}
                    onClick={() => run(dream.id, () => unhideDream(dream.id))}
                    className={smallButton}
                  >
                    Show in feed again
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Section>
      </div>

      <Section title="Find a dreamer">
        <FindDreamer />
      </Section>
    </div>
  )
}
