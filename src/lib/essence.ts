import { addDays } from './dates'
import { habitsDueOn, type Habit, type HabitChecks } from './habits'

/** Earned for each day on which every habit due that day was ticked. Nothing for a partial day. */
export const ESSENCE_PERFECT_DAY = 10

/** Whether every habit due on `day` was ticked, and at least one was due. */
export function isPerfectDay(habits: Habit[], checks: HabitChecks, day: string): boolean {
  const due = habitsDueOn(habits, day)
  return due.length > 0 && due.every((habit) => checks.get(habit.id)?.has(day) ?? false)
}

/**
 * Dream Essence is derived from the user's habit ticks rather than stored as a counter, so it
 * follows the account across devices and can't be edited client-side. The database only allows
 * ticks for today and yesterday, so past days can't be filled in for essence; unticking a habit
 * takes the day's essence back.
 */
export function essenceFromHabits(habits: Habit[], checks: HabitChecks, today: string): number {
  if (habits.length === 0) return 0
  let day = habits.reduce((first, habit) => (habit.createdOn < first ? habit.createdOn : first), today)
  let perfectDays = 0
  for (; day <= today; day = addDays(day, 1)) {
    if (isPerfectDay(habits, checks, day)) perfectDays++
  }
  return perfectDays * ESSENCE_PERFECT_DAY
}
