import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { DreamJournalEntry, DreamStreakSummary } from '../types/dreamStreak'

const ENTRIES_KEY = 'dreamapp:dream-streak-entries'
const REALITY_CHECK_GOAL = 5

interface DreamStreakContextValue extends DreamStreakSummary {
  entries: Record<string, DreamJournalEntry>
  todayKey: string
  todayEntry: DreamJournalEntry | null
  realityCheckGoal: number
  logToday: (recalled: boolean, note: string, dreamSigns: string[]) => void
  logEntry: (date: string, recalled: boolean, note: string, dreamSigns: string[]) => void
  addRealityCheck: () => void
}

function toDateKey(date: Date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function todayKey() {
  return toDateKey(new Date())
}

function dateKeyOffset(offsetDays: number) {
  const date = new Date()
  date.setDate(date.getDate() + offsetDays)
  return toDateKey(date)
}

function isNextDay(earlierKey: string, laterKey: string) {
  const [y, m, d] = earlierKey.split('-').map(Number)
  const next = new Date(y, m - 1, d)
  next.setDate(next.getDate() + 1)
  return toDateKey(next) === laterKey
}

function loadEntries(): Record<string, DreamJournalEntry> {
  try {
    const raw = localStorage.getItem(ENTRIES_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

function computeSummary(entries: Record<string, DreamJournalEntry>): DreamStreakSummary {
  const totalRecalled = Object.values(entries).filter((e) => e.recalled).length

  let longestStreak = 0
  let run = 0
  let prevRecalledDate: string | null = null
  for (const date of Object.keys(entries).sort()) {
    const entry = entries[date]
    if (!entry.recalled) {
      run = 0
      prevRecalledDate = null
      continue
    }
    run = prevRecalledDate && isNextDay(prevRecalledDate, date) ? run + 1 : 1
    prevRecalledDate = date
    longestStreak = Math.max(longestStreak, run)
  }

  let currentStreak = 0
  let offset = entries[todayKey()]?.recalled ? 0 : -1
  for (;;) {
    const entry = entries[dateKeyOffset(offset)]
    if (!entry || !entry.recalled) break
    currentStreak += 1
    offset -= 1
  }

  return { currentStreak, longestStreak, totalRecalled }
}

const DreamStreakContext = createContext<DreamStreakContextValue | undefined>(undefined)

export function DreamStreakProvider({ children }: { children: ReactNode }) {
  const [entries, setEntries] = useState<Record<string, DreamJournalEntry>>(loadEntries)

  useEffect(() => {
    localStorage.setItem(ENTRIES_KEY, JSON.stringify(entries))
  }, [entries])

  const summary = useMemo(() => computeSummary(entries), [entries])
  const key = todayKey()
  const todayEntry = entries[key] ?? null

  function logEntry(date: string, recalled: boolean, note: string, dreamSigns: string[]) {
    setEntries((prev) => ({
      ...prev,
      [date]: {
        date,
        recalled,
        note: note.trim(),
        dreamSigns,
        realityChecks: prev[date]?.realityChecks ?? 0,
      },
    }))
  }

  function logToday(recalled: boolean, note: string, dreamSigns: string[]) {
    logEntry(key, recalled, note, dreamSigns)
  }

  function addRealityCheck() {
    setEntries((prev) => {
      const existing = prev[key]
      const nextCount = Math.min((existing?.realityChecks ?? 0) + 1, REALITY_CHECK_GOAL)
      return {
        ...prev,
        [key]: {
          date: key,
          recalled: existing?.recalled ?? false,
          note: existing?.note ?? '',
          dreamSigns: existing?.dreamSigns ?? [],
          realityChecks: nextCount,
        },
      }
    })
  }

  return (
    <DreamStreakContext.Provider
      value={{
        entries,
        todayKey: key,
        todayEntry,
        realityCheckGoal: REALITY_CHECK_GOAL,
        logToday,
        logEntry,
        addRealityCheck,
        ...summary,
      }}
    >
      {children}
    </DreamStreakContext.Provider>
  )
}

export function useDreamStreak() {
  const ctx = useContext(DreamStreakContext)
  if (!ctx) throw new Error('useDreamStreak must be used within a DreamStreakProvider')
  return ctx
}

export function getDateKeyOffset(offsetDays: number) {
  return dateKeyOffset(offsetDays)
}
