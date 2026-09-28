import { useMemo, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import DreamCardSkeleton from '../../components/DreamCardSkeleton'
import { FormError } from '../../components/TextField'
import { useDreamPosts } from '../../context/useDreamPosts'
import { formatDreamDate, todayLocal } from '../../lib/dates'
import { CALENDAR_WEEKS, progressFromDreams, type CalendarDay, type Milestone } from '../../lib/progress'
import { useDocumentTitle } from '../../lib/useDocumentTitle'
import { cardClass, primaryButtonClass } from '../../styles/ui'

const NEW_DREAM = '/dreams/new?from=journal'
const WEEKDAY_LABELS = ['Mon', '', 'Wed', '', 'Fri', '', 'Sun']

function Stat({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <div className="rounded-xl border border-midnight-700 bg-midnight-900/60 p-4">
      <dt className="text-xs text-moon-500">{label}</dt>
      <dd className="mt-1 text-2xl font-semibold text-moon-100">{value}</dd>
      {hint && <dd className="mt-0.5 text-xs text-moon-400">{hint}</dd>}
    </div>
  )
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className={`space-y-4 p-5 sm:p-6 ${cardClass}`}>
      <h2 className="text-lg font-medium text-moon-100">{title}</h2>
      {children}
    </section>
  )
}

function dayClass(day: CalendarDay) {
  if (day.future) return 'bg-transparent'
  if (day.lucid) return 'bg-aurora-400'
  if (day.dreams >= 2) return 'bg-nebula-400'
  if (day.dreams === 1) return 'bg-nebula-500/50'
  return 'bg-midnight-800'
}

function dayTitle(day: CalendarDay) {
  const date = formatDreamDate(day.day)
  if (day.dreams === 0) return `${date}: no dreams`
  const lucid = day.lucid ? ', lucid' : ''
  return `${date}: ${day.dreams} dream${day.dreams === 1 ? '' : 's'}${lucid}`
}

function RecallCalendar({ weeks, nights }: { weeks: CalendarDay[][]; nights: number }) {
  const recent = weeks.flat().filter((day) => day.dreams > 0).length
  return (
    <div>
      <div
        role="img"
        aria-label={`Dreams logged on ${recent} nights in the last ${CALENDAR_WEEKS} weeks`}
        className="flex gap-1 overflow-x-auto pb-1"
      >
        <div className="mr-1 grid grid-rows-7 gap-1 text-[10px] leading-3 text-moon-500" aria-hidden>
          {WEEKDAY_LABELS.map((label, i) => (
            <span key={i} className="h-3 sm:h-4">
              {label}
            </span>
          ))}
        </div>
        {weeks.map((week) => (
          <div key={week[0].day} className="grid grid-rows-7 gap-1">
            {week.map((day) => (
              <span
                key={day.day}
                title={day.future ? undefined : dayTitle(day)}
                className={`h-3 w-3 rounded-[3px] sm:h-4 sm:w-4 ${dayClass(day)}`}
              />
            ))}
          </div>
        ))}
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-moon-400">
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-[3px] bg-midnight-800" /> None
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-[3px] bg-nebula-500/50" /> 1 dream
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-[3px] bg-nebula-400" /> 2+
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-[3px] bg-aurora-400" /> Lucid
        </span>
        <span className="ml-auto">{nights} nights recorded in total</span>
      </div>
    </div>
  )
}

function MilestoneRow({ milestone }: { milestone: Milestone }) {
  const done = milestone.value >= milestone.target
  const shown = Math.min(milestone.value, milestone.target)
  return (
    <li
      className={`rounded-xl border p-4 ${
        done ? 'border-aurora-400/40 bg-aurora-400/5' : 'border-midnight-700 bg-midnight-900/40'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className={`font-medium ${done ? 'text-aurora-200' : 'text-moon-100'}`}>
            <span aria-hidden className="mr-1.5">
              {done ? '✦' : '○'}
            </span>
            {milestone.label}
          </p>
          <p className="mt-0.5 text-sm text-moon-400">{milestone.description}</p>
        </div>
        <span className="shrink-0 text-sm text-moon-400">
          {done ? <span className="text-aurora-300">Earned</span> : `${shown} / ${milestone.target}`}
        </span>
      </div>
      {!done && (
        <div
          role="progressbar"
          aria-label={milestone.label}
          aria-valuemin={0}
          aria-valuemax={milestone.target}
          aria-valuenow={shown}
          className="mt-3 h-1.5 overflow-hidden rounded-full bg-midnight-800"
        >
          <div
            className="h-full rounded-full bg-nebula-400"
            style={{ width: `${(shown / milestone.target) * 100}%` }}
          />
        </div>
      )}
    </li>
  )
}

function BarList({ rows }: { rows: { label: string; count: number; to?: string }[] }) {
  const max = Math.max(1, ...rows.map((row) => row.count))
  return (
    <ul className="space-y-2.5">
      {rows.map((row) => (
        <li key={row.label} className="text-sm">
          <div className="flex justify-between gap-3">
            {row.to ? (
              <Link to={row.to} className="truncate text-moon-300 hover:text-nebula-300">
                {row.label}
              </Link>
            ) : (
              <span className="truncate text-moon-300">{row.label}</span>
            )}
            <span className="text-moon-400">{row.count}</span>
          </div>
          <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-midnight-800" aria-hidden>
            <div
              className="h-full rounded-full bg-nebula-500"
              style={{ width: `${(row.count / max) * 100}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  )
}

function streakHint(current: number, loggedToday: boolean) {
  if (current === 0) return 'Log a dream today to start one'
  if (!loggedToday) return 'Log today to keep it going'
  return 'Logged today ✓'
}

export default function ProgressPage() {
  useDocumentTitle('Progress')
  const { myDreams, loadingMyDreams, myDreamsError } = useDreamPosts()
  const progress = useMemo(() => progressFromDreams(myDreams, todayLocal()), [myDreams])

  let content
  if (myDreamsError) {
    content = <FormError message={myDreamsError} />
  } else if (loadingMyDreams && myDreams.length === 0) {
    content = <DreamCardSkeleton label="Adding up your nights..." />
  } else if (myDreams.length === 0) {
    content = (
      <div className="rounded-2xl border border-dashed border-nebula-400/30 bg-nebula-500/5 p-8 text-center">
        <p className="font-medium text-moon-100">Nothing to count yet</p>
        <p className="mt-1 text-sm text-moon-400">
          Write down your first dream and your streaks, milestones and dream signs will show up
          here.
        </p>
        <Link to={NEW_DREAM} className={`mt-4 ${primaryButtonClass}`}>
          Write your first dream
        </Link>
      </div>
    )
  } else {
    const lucidRate = Math.round((progress.lucidDreams / progress.dreams) * 100)
    const moods = progress.moods
      .filter((row) => row.count > 0)
      .map((row) => ({ label: row.mood ?? 'No mood', count: row.count }))
    content = (
      <div className="space-y-6">
        <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat
            label="Current streak"
            value={`${progress.currentStreak} ${progress.currentStreak === 1 ? 'night' : 'nights'}`}
            hint={streakHint(progress.currentStreak, progress.loggedToday)}
          />
          <Stat label="Longest streak" value={`${progress.longestStreak} nights`} />
          <Stat label="Dreams logged" value={progress.dreams} hint={`over ${progress.nights} nights`} />
          <Stat
            label="Lucid dreams"
            value={progress.lucidDreams}
            hint={`${lucidRate}% of dreams · ✦ ${progress.essence}`}
          />
        </dl>

        <Section title={`Last ${CALENDAR_WEEKS} weeks`}>
          <RecallCalendar weeks={progress.calendar} nights={progress.nights} />
        </Section>

        <Section title="Milestones">
          <ul className="grid gap-3 sm:grid-cols-2">
            {progress.milestones.map((milestone) => (
              <MilestoneRow key={milestone.id} milestone={milestone} />
            ))}
          </ul>
        </Section>

        <div className="grid gap-6 md:grid-cols-2">
          <Section title="Moods">
            <BarList rows={moods} />
          </Section>
          <Section title="Top dream signs">
            {progress.topSigns.length > 0 ? (
              <BarList
                rows={progress.topSigns.map(({ sign, count }) => ({
                  label: sign,
                  count,
                  to: `/journal?q=${encodeURIComponent(sign)}`,
                }))}
              />
            ) : (
              <p className="text-sm text-moon-400">
                Tag the symbols you notice when you write a dream, and the ones that keep coming
                back will show up here.
              </p>
            )}
          </Section>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-moon-100">Progress</h1>
          <p className="mt-1 text-sm text-moon-400">
            How your dream recall is going. Everything here comes from your own journal.
          </p>
        </div>
        {myDreams.length > 0 && (
          <Link to={NEW_DREAM} className={primaryButtonClass}>
            Log a dream
          </Link>
        )}
      </header>
      {content}
    </div>
  )
}
