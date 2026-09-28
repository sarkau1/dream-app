import { addDays, weekdayIndex } from './dates'
import { essenceFromDreams } from './essence'
import { DREAM_MOODS, type DreamMood, type DreamPost } from '../types/dream'

type ProgressDream = Pick<DreamPost, 'dreamtOn' | 'mood' | 'symbols'>

/** Weeks shown in the recall calendar. */
export const CALENDAR_WEEKS = 12

export interface CalendarDay {
  day: string
  dreams: number
  lucid: boolean
  /** After today: an empty slot that pads out the current week. */
  future: boolean
}

export interface Milestone {
  id: string
  label: string
  description: string
  value: number
  target: number
}

export interface Progress {
  dreams: number
  nights: number
  lucidDreams: number
  essence: number
  currentStreak: number
  longestStreak: number
  /** Whether a dream has been logged for today yet; if not, the current streak is at risk. */
  loggedToday: boolean
  /** Monday-first weeks, oldest first, the last one holding today. */
  calendar: CalendarDay[][]
  moods: { mood: DreamMood | null; count: number }[]
  topSigns: { sign: string; count: number }[]
  milestones: Milestone[]
}

/**
 * Longest run of consecutive days in `days` (distinct, sorted ascending), and the run that is
 * still alive: one ending today, or yesterday, since this morning's dream may not be written yet.
 */
function streaks(days: string[], today: string) {
  let longest = 0
  let run = 0
  let previous: string | null = null
  for (const day of days) {
    run = previous && addDays(previous, 1) === day ? run + 1 : 1
    longest = Math.max(longest, run)
    previous = day
  }
  const alive = previous === today || previous === addDays(today, -1)
  return { longest, current: alive ? run : 0 }
}

function calendarWeeks(counts: Map<string, number>, lucidDays: Set<string>, today: string) {
  const start = addDays(today, -weekdayIndex(today) - 7 * (CALENDAR_WEEKS - 1))
  const weeks: CalendarDay[][] = []
  for (let week = 0; week < CALENDAR_WEEKS; week++) {
    const days: CalendarDay[] = []
    for (let weekday = 0; weekday < 7; weekday++) {
      const day = addDays(start, week * 7 + weekday)
      days.push({ day, dreams: counts.get(day) ?? 0, lucid: lucidDays.has(day), future: day > today })
    }
    weeks.push(days)
  }
  return weeks
}

/** Everything the Progress page shows, derived from the user's own dreams. */
export function progressFromDreams(dreams: ProgressDream[], today: string): Progress {
  // Dreams dated in the future (a mistyped date) would otherwise stretch a streak ahead of today.
  const past = dreams.filter((dream) => dream.dreamtOn <= today)

  const counts = new Map<string, number>()
  const lucidDays = new Set<string>()
  for (const dream of past) {
    counts.set(dream.dreamtOn, (counts.get(dream.dreamtOn) ?? 0) + 1)
    if (dream.mood === 'Lucid') lucidDays.add(dream.dreamtOn)
  }
  const days = [...counts.keys()].sort()
  const { longest, current } = streaks(days, today)

  const signCounts = new Map<string, number>()
  for (const dream of dreams) {
    for (const sign of new Set(dream.symbols.map((s) => s.toLowerCase()))) {
      signCounts.set(sign, (signCounts.get(sign) ?? 0) + 1)
    }
  }
  const topSigns = [...signCounts]
    .sort(([a, countA], [b, countB]) => countB - countA || a.localeCompare(b))
    .slice(0, 5)
    .map(([sign, count]) => ({ sign, count }))

  const moods = [...DREAM_MOODS, null].map((mood) => ({
    mood,
    count: dreams.filter((dream) => dream.mood === mood).length,
  }))

  const lucidDreams = dreams.filter((dream) => dream.mood === 'Lucid').length
  const topSignCount = topSigns[0]?.count ?? 0

  const milestones: Milestone[] = [
    { id: 'first-dream', label: 'First entry', description: 'Write down your first dream.', value: dreams.length, target: 1 },
    { id: 'week-streak', label: 'Week of recall', description: 'Log a dream 7 nights in a row.', value: longest, target: 7 },
    { id: 'ten-dreams', label: 'Ten dreams', description: 'Keep 10 dreams in your journal.', value: dreams.length, target: 10 },
    { id: 'first-lucid', label: 'Awake inside', description: 'Log your first lucid dream.', value: lucidDreams, target: 1 },
    { id: 'sign-spotter', label: 'Sign spotter', description: 'Tag the same dream sign in 5 dreams.', value: topSignCount, target: 5 },
    { id: 'month-streak', label: 'Month of recall', description: 'Log a dream 30 nights in a row.', value: longest, target: 30 },
    { id: 'fifty-dreams', label: 'Fifty dreams', description: 'Keep 50 dreams in your journal.', value: dreams.length, target: 50 },
    { id: 'ten-lucid', label: 'Lucid regular', description: 'Log 10 lucid dreams.', value: lucidDreams, target: 10 },
  ]

  return {
    dreams: dreams.length,
    nights: days.length,
    lucidDreams,
    essence: essenceFromDreams(dreams),
    currentStreak: current,
    longestStreak: longest,
    loggedToday: counts.has(today),
    calendar: calendarWeeks(counts, lucidDays, today),
    moods,
    topSigns,
    milestones,
  }
}
