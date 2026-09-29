import { useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { FormError } from '../../components/TextField'
import { useAuth } from '../../context/useAuth'
import { todayLocal } from '../../lib/dates'
import type { Habit, HabitChecks } from '../../lib/habits'
import {
  addHabit,
  deleteHabit,
  fetchHabits,
  setArchived,
  setCheck,
  updateHabit,
  type HabitInput,
} from '../../lib/habitsApi'
import { useDocumentTitle } from '../../lib/useDocumentTitle'
import MirrorTab from './MirrorTab'
import TodayTab from './TodayTab'

type Tab = 'today' | 'mirror'

const TABS: { value: Tab; label: string; icon: string }[] = [
  { value: 'today', label: 'Today', icon: '✓' },
  { value: 'mirror', label: 'Mirror', icon: '🪞' },
]

function withCheck(checks: HabitChecks, habitId: string, day: string, done: boolean): HabitChecks {
  const next = new Map(checks)
  const days = new Set(next.get(habitId) ?? [])
  if (done) days.add(day)
  else days.delete(day)
  next.set(habitId, days)
  return next
}

/**
 * Habits: tick them off on Today, see the honest numbers in the Mirror. Private to the user,
 * like their journal. Built phone-first: big rows, a tab bar at the bottom of the screen.
 */
export default function HabitsPage() {
  useDocumentTitle('Habits')
  const { user } = useAuth()
  const userId = user?.id ?? null
  const [searchParams, setSearchParams] = useSearchParams()
  const tab: Tab = searchParams.get('tab') === 'mirror' ? 'mirror' : 'today'
  const [habits, setHabits] = useState<Habit[] | null>(null)
  const [checks, setChecks] = useState<HabitChecks>(new Map())
  const [error, setError] = useState<string | null>(null)
  // Read when rendering, so the page moves to the new day if it stays open past midnight.
  const today = todayLocal()

  useEffect(() => {
    if (!userId) return
    let cancelled = false
    fetchHabits(userId).then((result) => {
      if (cancelled) return
      setHabits(result.habits)
      setChecks(result.checks)
      setError(result.error)
    })
    return () => {
      cancelled = true
    }
  }, [userId])

  const chooseTab = (value: Tab) =>
    setSearchParams(value === 'today' ? {} : { tab: value }, { replace: true })

  // Ticks show straight away and are undone if saving fails.
  const toggle = useCallback(
    async (habit: Habit, day: string) => {
      if (!userId) return
      const done = !(checks.get(habit.id)?.has(day) ?? false)
      setChecks((prev) => withCheck(prev, habit.id, day, done))
      setError(null)
      const result = await setCheck(habit.id, userId, day, done)
      if (result.error) {
        setChecks((prev) => withCheck(prev, habit.id, day, !done))
        setError(result.error)
      }
    },
    [checks, userId],
  )

  async function add(input: HabitInput) {
    if (!userId) return { error: 'Log in to add habits.' }
    const nextOrder = Math.max(0, ...(habits ?? []).map((h) => h.sortOrder)) + 1
    const result = await addHabit(userId, input, nextOrder, todayLocal())
    if (result.habit) setHabits((prev) => [...(prev ?? []), result.habit!])
    return { error: result.error }
  }

  async function edit(habit: Habit, input: HabitInput) {
    const result = await updateHabit(habit.id, input)
    if (!result.error) {
      setHabits((prev) =>
        (prev ?? []).map((h) => (h.id === habit.id ? { ...h, ...input, name: input.name.trim() } : h)),
      )
    }
    return result
  }

  async function archive(habit: Habit) {
    const day = todayLocal()
    const result = await setArchived(habit.id, day)
    if (!result.error) {
      setHabits((prev) => (prev ?? []).map((h) => (h.id === habit.id ? { ...h, archivedOn: day } : h)))
    }
    return result
  }

  // Starting a stopped habit again makes a fresh one: un-stopping the old one would count every
  // day in between as missed, and its record should stay as it was.
  const restore = (habit: Habit) => add({ name: habit.name, emoji: habit.emoji, days: habit.days })

  async function remove(habit: Habit) {
    const result = await deleteHabit(habit.id)
    if (!result.error) setHabits((prev) => (prev ?? []).filter((h) => h.id !== habit.id))
    return result
  }

  return (
    // Room at the bottom for the phone tab bar.
    <div className="mx-auto max-w-xl space-y-6 pb-24 md:pb-0">
      <header className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-moon-100">Habits</h1>
          <p className="mt-1 text-sm text-moon-400">Promises to yourself, and an honest mirror.</p>
        </div>
        {/* Wider screens: tabs up here. Phones get the bar at the bottom. */}
        <div role="tablist" aria-label="Habits view" className="hidden rounded-full border border-midnight-700 bg-midnight-900/70 p-1 md:flex">
          {TABS.map((t) => (
            <button
              key={t.value}
              type="button"
              role="tab"
              aria-selected={tab === t.value}
              onClick={() => chooseTab(t.value)}
              className={`rounded-full px-4 py-1.5 text-sm transition-colors ${
                tab === t.value ? 'bg-nebula-500 text-white' : 'text-moon-400 hover:text-moon-100'
              }`}
            >
              <span aria-hidden>{t.icon}</span> {t.label}
            </button>
          ))}
        </div>
      </header>

      <FormError message={error} />

      {habits === null ? (
        <div className="space-y-3" aria-label="Loading habits">
          <div className="h-44 animate-pulse rounded-3xl bg-midnight-900/70" />
          <div className="h-16 animate-pulse rounded-2xl bg-midnight-900/70" />
          <div className="h-16 animate-pulse rounded-2xl bg-midnight-900/70" />
        </div>
      ) : tab === 'today' ? (
        <TodayTab habits={habits} checks={checks} today={today} onToggle={toggle} onAdd={add} />
      ) : (
        <MirrorTab
          habits={habits}
          checks={checks}
          today={today}
          onEdit={edit}
          onArchive={archive}
          onRestore={restore}
          onDelete={remove}
        />
      )}

      <nav
        role="tablist"
        aria-label="Habits view"
        className="fixed inset-x-0 bottom-0 z-20 border-t border-midnight-700/70 bg-midnight-950/85 pb-[env(safe-area-inset-bottom)] backdrop-blur-lg md:hidden"
      >
        <div className="mx-auto flex max-w-xl">
          {TABS.map((t) => (
            <button
              key={t.value}
              type="button"
              role="tab"
              aria-selected={tab === t.value}
              onClick={() => chooseTab(t.value)}
              className={`relative flex min-h-16 flex-1 flex-col items-center justify-center gap-0.5 text-xs transition-colors ${
                tab === t.value ? 'text-moon-100' : 'text-moon-500'
              }`}
            >
              {tab === t.value && (
                <span className="absolute top-0 h-0.5 w-12 rounded-full bg-gradient-to-r from-nebula-400 to-aurora-400" aria-hidden />
              )}
              <span className="text-xl" aria-hidden>
                {t.icon}
              </span>
              {t.label}
            </button>
          ))}
        </div>
      </nav>
    </div>
  )
}
