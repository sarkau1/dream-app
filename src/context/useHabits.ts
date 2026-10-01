import { createContext, useContext, type Dispatch, type SetStateAction } from 'react'
import type { Habit, HabitChecks } from '../lib/habits'

// Lives apart from HabitsProvider so that file only exports a component (keeps fast refresh working).
export interface HabitsContextValue {
  /** Every habit, archived ones too; null while loading (or signed out). */
  habits: Habit[] | null
  checks: HabitChecks
  error: string | null
  setHabits: Dispatch<SetStateAction<Habit[] | null>>
  setChecks: Dispatch<SetStateAction<HabitChecks>>
  setError: Dispatch<SetStateAction<string | null>>
}

export const HabitsContext = createContext<HabitsContextValue | undefined>(undefined)

export function useHabits() {
  const ctx = useContext(HabitsContext)
  if (!ctx) throw new Error('useHabits must be used within a HabitsProvider')
  return ctx
}
