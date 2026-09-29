import { useMemo, useState } from 'react'
import HabitForm from '../../components/habits/HabitForm'
import { FormError } from '../../components/TextField'
import { formatDreamDate } from '../../lib/dates'
import {
  bestWeekday,
  describeDays,
  habitCalendar,
  habitStats,
  rate,
  verdict,
  type Habit,
  type HabitChecks,
  type HabitDayStatus,
  type HabitLabel,
  type HabitStats,
  type Tally,
} from '../../lib/habits'
import type { HabitInput } from '../../lib/habitsApi'

type Result = Promise<{ error: string | null }>

const EMPTY = new Set<string>()
const WEEKDAY_NAMES = ['Mondays', 'Tuesdays', 'Wednesdays', 'Thursdays', 'Fridays', 'Saturdays', 'Sundays']

const LABELS: Record<HabitLabel, { text: string; icon: string; className: string }> = {
  strong: { text: 'Strong', icon: '🔥', className: 'border-aurora-400/40 bg-aurora-400/10 text-aurora-200' },
  slipping: { text: 'Slipping', icon: '🌗', className: 'border-amber-400/40 bg-amber-400/10 text-amber-200' },
  neglected: { text: 'Neglected', icon: '🌑', className: 'border-rose-400/40 bg-rose-500/10 text-rose-200' },
  new: { text: 'New', icon: '🌱', className: 'border-midnight-600 bg-midnight-800 text-moon-400' },
}

const CELL: Record<HabitDayStatus, string> = {
  done: 'bg-aurora-400 shadow-[0_0_6px_rgba(94,230,200,0.6)]',
  missed: 'bg-rose-500/45',
  pending: 'bg-transparent ring-1 ring-inset ring-nebula-400',
  off: 'bg-midnight-700/70',
  before: 'bg-transparent',
  future: 'bg-transparent',
}

const percent = (t: Tally) => {
  const r = rate(t)
  return r === null ? '—' : `${Math.round(r * 100)}%`
}

function StatTile({ label, tally }: { label: string; tally: Tally }) {
  return (
    <div className="rounded-2xl border border-midnight-700 bg-midnight-900/70 p-3 text-center">
      <p className="text-[11px] uppercase tracking-widest text-moon-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums text-moon-100">{percent(tally)}</p>
      <p className="text-xs text-moon-500">
        {tally.done}/{tally.done + tally.missed}
      </p>
    </div>
  )
}

function HabitGrid({ habit, checks, today }: { habit: Habit; checks: Set<string>; today: string }) {
  const weeks = habitCalendar(habit, checks, today, 12)
  const done = weeks.flat().filter((d) => d.status === 'done').length
  const missed = weeks.flat().filter((d) => d.status === 'missed').length
  return (
    <div
      role="img"
      aria-label={`Last 12 weeks: ${done} done, ${missed} missed`}
      className="flex gap-[3px] overflow-x-auto"
    >
      {weeks.map((week) => (
        <div key={week[0].day} className="grid grid-rows-7 gap-[3px]">
          {week.map((cell) => (
            <span
              key={cell.day}
              title={cell.status === 'before' || cell.status === 'future' ? undefined : `${formatDreamDate(cell.day)}: ${cell.status}`}
              className={`h-3 w-3 rounded-[3px] ${CELL[cell.status]}`}
            />
          ))}
        </div>
      ))}
    </div>
  )
}

function HabitCard({
  stats,
  checks,
  today,
  onEdit,
  onArchive,
  onRestore,
  onDelete,
}: {
  stats: HabitStats
  checks: Set<string>
  today: string
  onEdit: (input: HabitInput) => Result
  onArchive: () => Result
  onRestore: () => Result
  onDelete: () => Result
}) {
  const { habit } = stats
  const [editing, setEditing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const label = LABELS[stats.label]
  const archived = habit.archivedOn !== null
  const ticked = checks.size

  async function act(action: () => Result, confirmText?: string) {
    if (confirmText && !window.confirm(confirmText)) return
    setError((await action()).error)
  }

  if (editing) {
    return (
      <li>
        <HabitForm
          initial={{ name: habit.name, emoji: habit.emoji, days: habit.days }}
          submitLabel="Save"
          onSubmit={async (input) => {
            const result = await onEdit(input)
            if (!result.error) setEditing(false)
            return result
          }}
          onCancel={() => setEditing(false)}
        />
      </li>
    )
  }

  return (
    <li className={`rise-in space-y-4 rounded-2xl border border-midnight-700/80 bg-midnight-900/70 p-4 ${archived ? 'opacity-70' : ''}`}>
      <div className="flex items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-midnight-800 text-2xl" aria-hidden>
          {habit.emoji ?? '✦'}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium text-moon-100">{habit.name}</p>
          <p className="text-xs text-moon-500">
            {describeDays(habit.days)} · since {formatDreamDate(habit.createdOn)}
            {archived && ` · stopped ${formatDreamDate(habit.archivedOn!)}`}
          </p>
        </div>
        {!archived && (
          <span className={`shrink-0 rounded-full border px-2.5 py-0.5 text-xs font-medium ${label.className}`}>
            <span aria-hidden>{label.icon}</span> {label.text}
          </span>
        )}
      </div>

      <dl className="grid grid-cols-4 gap-2 text-center">
        <div>
          <dt className="text-[10px] uppercase tracking-wider text-moon-500">Streak</dt>
          <dd className="font-semibold tabular-nums text-moon-100">{stats.streak}</dd>
        </div>
        <div>
          <dt className="text-[10px] uppercase tracking-wider text-moon-500">Best</dt>
          <dd className="font-semibold tabular-nums text-moon-100">{stats.best}</dd>
        </div>
        <div>
          <dt className="text-[10px] uppercase tracking-wider text-moon-500">30 days</dt>
          <dd className="font-semibold tabular-nums text-moon-100">{percent(stats.last30)}</dd>
        </div>
        <div>
          <dt className="text-[10px] uppercase tracking-wider text-moon-500">Missed</dt>
          <dd className={`font-semibold tabular-nums ${stats.allTime.missed > 0 ? 'text-rose-300' : 'text-moon-100'}`}>
            {stats.allTime.missed}
          </dd>
        </div>
      </dl>

      <HabitGrid habit={habit} checks={checks} today={today} />

      <FormError message={error} />
      <div className="flex flex-wrap gap-2 text-xs">
        {archived ? (
          <button type="button" onClick={() => act(onRestore)} className="rounded-full border border-midnight-700 px-3 py-1.5 text-moon-300 hover:text-moon-100">
            Start again
          </button>
        ) : (
          <>
            <button type="button" onClick={() => setEditing(true)} className="rounded-full border border-midnight-700 px-3 py-1.5 text-moon-300 hover:text-moon-100">
              Edit
            </button>
            <button
              type="button"
              onClick={() =>
                act(onArchive, `Stop “${habit.name}”? Its history stays in your Mirror; it just won’t be asked for any more.`)
              }
              className="rounded-full border border-midnight-700 px-3 py-1.5 text-moon-300 hover:text-moon-100"
            >
              Stop habit
            </button>
          </>
        )}
        <button
          type="button"
          onClick={() =>
            act(
              onDelete,
              `Delete “${habit.name}” for good? ${ticked === 0 ? 'It has no ticks yet.' : `Its ${ticked} ticked ${ticked === 1 ? 'day' : 'days'} will be erased from your Mirror.`} This can’t be undone. (Stop habit keeps the history.)`,
            )
          }
          className="rounded-full border border-rose-500/40 px-3 py-1.5 text-rose-300 hover:bg-rose-500/10"
        >
          Delete
        </button>
      </div>
    </li>
  )
}

export default function MirrorTab({
  habits,
  checks,
  today,
  onEdit,
  onArchive,
  onRestore,
  onDelete,
}: {
  habits: Habit[]
  checks: HabitChecks
  today: string
  onEdit: (habit: Habit, input: HabitInput) => Result
  onArchive: (habit: Habit) => Result
  onRestore: (habit: Habit) => Result
  onDelete: (habit: Habit) => Result
}) {
  const [showStopped, setShowStopped] = useState(false)
  const v = useMemo(() => verdict(habits, checks, today), [habits, checks, today])
  const stats = useMemo(
    () => habits.map((habit) => habitStats(habit, checks.get(habit.id) ?? EMPTY, today)),
    [habits, checks, today],
  )
  const weekday = useMemo(() => bestWeekday(habits, checks, today), [habits, checks, today])
  const active = stats.filter((s) => s.habit.archivedOn === null)
  const stopped = stats.filter((s) => s.habit.archivedOn !== null)
  const counts = (label: HabitLabel) => active.filter((s) => s.label === label).length
  const judged = active.filter((s) => s.label !== 'new' && rate(s.last30) !== null)
  const best = [...judged].sort((a, b) => rate(b.last30)! - rate(a.last30)!)[0]
  const worst = [...judged].sort((a, b) => rate(a.last30)! - rate(b.last30)!)[0]

  if (habits.length === 0) {
    return <p className="text-moon-400">Add a habit on the Today tab, and your Mirror fills in from there.</p>
  }

  const weekRate = rate(v.thisWeek)
  const kept = v.thisWeek.done
  const promised = v.thisWeek.done + v.thisWeek.missed

  return (
    <div className="space-y-6">
      {/* The verdict: what a mirror would say, no flattery. */}
      <section className="mirror-sheen relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-nebula-500/25 via-midnight-900/80 to-aurora-400/15 p-6 shadow-2xl shadow-nebula-500/10 backdrop-blur">
        <p className="text-xs uppercase tracking-[0.25em] text-moon-400">This week in the mirror</p>
        <div className="mt-3 flex items-end gap-3">
          <p className="bg-gradient-to-br from-moon-100 to-nebula-300 bg-clip-text text-6xl font-bold tabular-nums text-transparent">
            {weekRate === null ? '—' : `${Math.round(weekRate * 100)}%`}
          </p>
          {v.trend !== null && (
            <span
              className={`mb-2 rounded-full px-2.5 py-0.5 text-sm font-medium ${
                v.trend >= 0 ? 'bg-aurora-400/15 text-aurora-200' : 'bg-rose-500/15 text-rose-200'
              }`}
            >
              {v.trend >= 0 ? '↑' : '↓'} {Math.abs(v.trend)} vs last week
            </span>
          )}
        </div>
        <p className="mt-2 text-lg text-moon-100">
          {promised === 0 ? (
            'No promises due yet this week.'
          ) : (
            <>
              You kept <strong>{kept}</strong> of <strong>{promised}</strong> promises.
              {v.thisWeek.missed > 0 && (
                <span className="text-rose-200"> {v.thisWeek.missed} missed.</span>
              )}
            </>
          )}
        </p>
        <p className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-moon-400">
          <span>🔥 {counts('strong')} strong</span>
          <span>🌗 {counts('slipping')} slipping</span>
          <span>🌑 {counts('neglected')} neglected</span>
        </p>
      </section>

      <div className="grid grid-cols-3 gap-3">
        <StatTile label="Week" tally={v.thisWeek} />
        <StatTile label="30 days" tally={v.last30} />
        <StatTile label="All time" tally={v.allTime} />
      </div>

      {(best || weekday !== null) && (
        <ul className="space-y-2 text-sm">
          {best && (
            <li className="rounded-2xl border border-aurora-400/20 bg-aurora-400/5 px-4 py-3 text-moon-300">
              <span className="text-aurora-200">Most consistent:</span> {best.habit.emoji} {best.habit.name} ({percent(best.last30)})
            </li>
          )}
          {worst && worst !== best && rate(worst.last30)! < 0.8 && (
            <li className="rounded-2xl border border-rose-400/20 bg-rose-500/5 px-4 py-3 text-moon-300">
              <span className="text-rose-200">Needs attention:</span> {worst.habit.emoji} {worst.habit.name} ({percent(worst.last30)})
            </li>
          )}
          {weekday !== null && (
            <li className="rounded-2xl border border-nebula-400/20 bg-nebula-500/5 px-4 py-3 text-moon-300">
              <span className="text-nebula-200">Your best day:</span> you’re most consistent on {WEEKDAY_NAMES[weekday]}.
            </li>
          )}
        </ul>
      )}

      <section className="space-y-3">
        <h2 className="text-lg font-medium text-moon-100">Each habit</h2>
        <p className="flex flex-wrap items-center gap-3 text-xs text-moon-500">
          <span className="inline-flex items-center gap-1.5"><span className={`h-3 w-3 rounded-[3px] ${CELL.done}`} /> done</span>
          <span className="inline-flex items-center gap-1.5"><span className={`h-3 w-3 rounded-[3px] ${CELL.missed}`} /> missed</span>
          <span className="inline-flex items-center gap-1.5"><span className={`h-3 w-3 rounded-[3px] ${CELL.off}`} /> not scheduled</span>
        </p>
        <ul className="space-y-3">
          {active.map((s) => (
            <HabitCard
              key={s.habit.id}
              stats={s}
              checks={checks.get(s.habit.id) ?? EMPTY}
              today={today}
              onEdit={(input) => onEdit(s.habit, input)}
              onArchive={() => onArchive(s.habit)}
              onRestore={() => onRestore(s.habit)}
              onDelete={() => onDelete(s.habit)}
            />
          ))}
        </ul>
      </section>

      {stopped.length > 0 && (
        <section className="space-y-3">
          <button
            type="button"
            aria-expanded={showStopped}
            onClick={() => setShowStopped(!showStopped)}
            className="text-sm text-moon-400 hover:text-moon-100"
          >
            {showStopped ? '▾' : '▸'} Stopped habits ({stopped.length}): their history still counts
          </button>
          {showStopped && (
            <ul className="space-y-3">
              {stopped.map((s) => (
                <HabitCard
                  key={s.habit.id}
                  stats={s}
                  checks={checks.get(s.habit.id) ?? EMPTY}
                  today={today}
                  onEdit={(input) => onEdit(s.habit, input)}
                  onArchive={() => onArchive(s.habit)}
                  onRestore={() => onRestore(s.habit)}
                  onDelete={() => onDelete(s.habit)}
                />
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
  )
}
