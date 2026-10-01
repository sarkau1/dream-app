import { useEffect, useMemo, useState, type ReactNode } from 'react'
import type { Habit, HabitChecks } from '../lib/habits'
import { fetchHabits } from '../lib/habitsApi'
import { useAuth } from './useAuth'
import { HabitsContext } from './useHabits'

/**
 * The signed-in user's habits and ticks, loaded once and shared: the Habits page edits them and
 * the nav bar and profile derive Dream Essence from them.
 */
export function HabitsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const userId = user?.id ?? null
  const [habits, setHabits] = useState<Habit[] | null>(null)
  const [checks, setChecks] = useState<HabitChecks>(new Map())
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    // Signed out: clear the last user's habits (in a callback, not synchronously in the effect).
    const load = userId
      ? fetchHabits(userId)
      : Promise.resolve({ habits: null, checks: new Map() as HabitChecks, error: null })
    load.then((result) => {
      if (cancelled) return
      setHabits(result.habits)
      setChecks(result.checks)
      setError(result.error)
    })
    return () => {
      cancelled = true
    }
  }, [userId])

  const value = useMemo(
    () => ({ habits, checks, error, setHabits, setChecks, setError }),
    [habits, checks, error],
  )
  return <HabitsContext.Provider value={value}>{children}</HabitsContext.Provider>
}
