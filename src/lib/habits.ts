import { addDays, weekdayIndex } from './dates'

// The Mirror habit tracker's numbers. Everything is worked out from two things: the habits
// (what, which weekdays, since when) and the days each was ticked. Days are calendar days
// ("YYYY-MM-DD", see lib/dates); weekdays run Monday = 0 .. Sunday = 6, like the database.

/** Mirrors habits_name_length in supabase/schema.sql. */
export const MAX_HABIT_NAME_LENGTH = 80
export const EVERY_DAY = [0, 1, 2, 3, 4, 5, 6]

export interface Habit {
  id: string
  name: string
  emoji: string | null
  days: number[]
  sortOrder: number
  createdOn: string
  archivedOn: string | null
}

/** Each habit's ticked days. */
export type HabitChecks = Map<string, Set<string>>

/**
 * - done: ticked
 * - missed: scheduled, in the past, not ticked
 * - pending: scheduled today and not ticked yet (not a miss until the day is over)
 * - off: not a scheduled weekday, or after the habit was archived
 * - before / future: outside the habit's life so far
 */
export type HabitDayStatus = 'done' | 'missed' | 'pending' | 'off' | 'before' | 'future'

export type HabitLabel = 'strong' | 'slipping' | 'neglected' | 'new'

const EMPTY = new Set<string>()

/** Whether the habit is still running (not archived) on `day`. */
export function isActiveOn(habit: Habit, day: string): boolean {
  return day >= habit.createdOn && (habit.archivedOn === null || day < habit.archivedOn)
}

/** Whether the habit asks to be done on `day`. */
export function isScheduledOn(habit: Habit, day: string): boolean {
  return isActiveOn(habit, day) && habit.days.includes(weekdayIndex(day))
}

export function dayStatus(habit: Habit, checks: Set<string>, day: string, today: string): HabitDayStatus {
  if (day > today) return 'future'
  if (day < habit.createdOn) return 'before'
  if (!isActiveOn(habit, day)) return 'off'
  // A tick counts even on a day that's no longer scheduled (e.g. after a schedule change).
  if (checks.has(day)) return 'done'
  if (!habit.days.includes(weekdayIndex(day))) return 'off'
  return day === today ? 'pending' : 'missed'
}

export interface Tally {
  done: number
  missed: number
}

export const rate = ({ done, missed }: Tally) => (done + missed === 0 ? null : done / (done + missed))

/** Done and missed days for one habit between `from` and `to`, inclusive. */
export function tally(habit: Habit, checks: Set<string>, from: string, to: string, today: string): Tally {
  const result = { done: 0, missed: 0 }
  const start = from < habit.createdOn ? habit.createdOn : from
  const end = to > today ? today : to
  for (let day = start; day <= end; day = addDays(day, 1)) {
    const status = dayStatus(habit, checks, day, today)
    if (status === 'done') result.done++
    else if (status === 'missed') result.missed++
  }
  return result
}

function sumTallies(tallies: Tally[]): Tally {
  return tallies.reduce((sum, t) => ({ done: sum.done + t.done, missed: sum.missed + t.missed }), {
    done: 0,
    missed: 0,
  })
}

/**
 * The run of done days ending now: today if it's done, otherwise it may still end yesterday,
 * since today isn't over. Days the habit is off don't break it.
 */
export function currentStreak(habit: Habit, checks: Set<string>, today: string): number {
  let streak = 0
  for (let day = today; day >= habit.createdOn; day = addDays(day, -1)) {
    const status = dayStatus(habit, checks, day, today)
    if (status === 'done') streak++
    else if (status === 'missed') break
  }
  return streak
}

export function bestStreak(habit: Habit, checks: Set<string>, today: string): number {
  let best = 0
  let run = 0
  for (let day = habit.createdOn; day <= today; day = addDays(day, 1)) {
    const status = dayStatus(habit, checks, day, today)
    if (status === 'done') best = Math.max(best, ++run)
    else if (status === 'missed') run = 0
  }
  return best
}

/** How the last 30 days went; 'new' until there are 5 scheduled days to judge. */
export function habitLabel(last30: Tally): HabitLabel {
  if (last30.done + last30.missed < 5) return 'new'
  const r = rate(last30)!
  if (r >= 0.8) return 'strong'
  if (r >= 0.5) return 'slipping'
  return 'neglected'
}

export interface HabitStats {
  habit: Habit
  streak: number
  best: number
  allTime: Tally
  last30: Tally
  label: HabitLabel
}

export function habitStats(habit: Habit, checks: Set<string>, today: string): HabitStats {
  const last30 = tally(habit, checks, addDays(today, -29), today, today)
  return {
    habit,
    streak: currentStreak(habit, checks, today),
    best: bestStreak(habit, checks, today),
    allTime: tally(habit, checks, habit.createdOn, today, today),
    last30,
    label: habitLabel(last30),
  }
}

export interface Verdict {
  thisWeek: Tally
  lastWeek: Tally
  /** This week's rate minus last week's, in percentage points; null if either is empty. */
  trend: number | null
  last30: Tally
  allTime: Tally
}

/** The Mirror's headline numbers across every habit, archived ones included. */
export function verdict(habits: Habit[], checks: HabitChecks, today: string): Verdict {
  const monday = addDays(today, -weekdayIndex(today))
  const over = (from: string, to: string) =>
    sumTallies(habits.map((h) => tally(h, checks.get(h.id) ?? EMPTY, from, to, today)))
  const thisWeek = over(monday, today)
  const lastWeek = over(addDays(monday, -7), addDays(monday, -1))
  const now = rate(thisWeek)
  const before = rate(lastWeek)
  return {
    thisWeek,
    lastWeek,
    trend: now === null || before === null ? null : Math.round((now - before) * 100),
    last30: over(addDays(today, -29), today),
    allTime: sumTallies(
      habits.map((h) => tally(h, checks.get(h.id) ?? EMPTY, h.createdOn, today, today)),
    ),
  }
}

/** The weekday (0 = Monday) with the best record, once each counted weekday has 4+ days. */
export function bestWeekday(habits: Habit[], checks: HabitChecks, today: string): number | null {
  const byWeekday = Array.from({ length: 7 }, () => ({ done: 0, missed: 0 }))
  for (const habit of habits) {
    const ticked = checks.get(habit.id) ?? EMPTY
    for (let day = habit.createdOn; day <= today; day = addDays(day, 1)) {
      const status = dayStatus(habit, ticked, day, today)
      if (status === 'done') byWeekday[weekdayIndex(day)].done++
      else if (status === 'missed') byWeekday[weekdayIndex(day)].missed++
    }
  }
  let best: number | null = null
  let bestRate = -1
  byWeekday.forEach((t, weekday) => {
    const r = rate(t)
    if (r !== null && t.done + t.missed >= 4 && r > bestRate) {
      best = weekday
      bestRate = r
    }
  })
  return best
}

/** Monday-first weeks, oldest first, ending with this week; for the Mirror's grids. */
export function habitCalendar(
  habit: Habit,
  checks: Set<string>,
  today: string,
  weeks = 12,
): { day: string; status: HabitDayStatus }[][] {
  const start = addDays(today, -weekdayIndex(today) - 7 * (weeks - 1))
  return Array.from({ length: weeks }, (_, week) =>
    Array.from({ length: 7 }, (_, weekday) => {
      const day = addDays(start, week * 7 + weekday)
      return { day, status: dayStatus(habit, checks, day, today) }
    }),
  )
}

/** Active habits scheduled on `day`, in the user's order. */
export function habitsDueOn(habits: Habit[], day: string): Habit[] {
  return habits.filter((habit) => isScheduledOn(habit, day)).sort((a, b) => a.sortOrder - b.sortOrder)
}

/** The list with the item at `from` moved to `to`, for reordering habits. */
export function moveItem<T>(items: T[], from: number, to: number): T[] {
  const next = [...items]
  const [item] = next.splice(from, 1)
  next.splice(to, 0, item)
  return next
}

/** "Every day", "Weekdays", "Weekends" or "Mon, Wed, Fri". */
export function describeDays(days: number[]): string {
  const sorted = [...days].sort()
  const key = sorted.join('')
  if (key === '0123456') return 'Every day'
  if (key === '01234') return 'Weekdays'
  if (key === '56') return 'Weekends'
  const names = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  return sorted.map((d) => names[d]).join(', ')
}

/**
 * The habits of the current run: the running ones, plus any stopped after the run began. The run
 * begins when the oldest running habit started, so restarting (every habit stopped and started
 * fresh today, see HabitsPage) leaves the old record out of Today and the Mirror. With nothing
 * running, every habit is kept.
 */
export function currentRun(habits: Habit[]): Habit[] {
  const running = habits.filter((habit) => habit.archivedOn === null)
  if (running.length === 0) return habits
  const start = running.reduce((first, habit) => (habit.createdOn < first ? habit.createdOn : first), running[0].createdOn)
  return habits.filter((habit) => habit.archivedOn === null || habit.archivedOn > start)
}
