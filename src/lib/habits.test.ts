import { describe, expect, it } from 'vitest'
import {
  bestStreak,
  bestWeekday,
  currentStreak,
  dayStatus,
  describeDays,
  EVERY_DAY,
  habitCalendar,
  habitLabel,
  habitsDueOn,
  moveItem,
  tally,
  verdict,
  type Habit,
} from './habits'

// 2026-09-28 is a Monday; "today" is Wednesday 2026-09-30.
const TODAY = '2026-09-30'

function habit(overrides: Partial<Habit> = {}): Habit {
  return {
    id: 'h1',
    name: 'Meditate',
    emoji: '🧘',
    days: EVERY_DAY,
    sortOrder: 0,
    createdOn: '2026-09-01',
    archivedOn: null,
    ...overrides,
  }
}

const ticks = (...days: string[]) => new Set(days)

describe('dayStatus', () => {
  const h = habit({ days: [0, 1, 2, 3, 4] }) // weekdays

  it('tells done, missed and pending apart', () => {
    const done = ticks('2026-09-29')
    expect(dayStatus(h, done, '2026-09-29', TODAY)).toBe('done')
    expect(dayStatus(h, done, '2026-09-28', TODAY)).toBe('missed')
    expect(dayStatus(h, done, TODAY, TODAY)).toBe('pending')
  })

  it('does not count unscheduled, future or pre-start days', () => {
    expect(dayStatus(h, ticks(), '2026-09-27', TODAY)).toBe('off') // Sunday
    expect(dayStatus(h, ticks(), '2026-10-01', TODAY)).toBe('future')
    expect(dayStatus(h, ticks(), '2026-08-31', TODAY)).toBe('before')
  })

  it('stops counting from the day a habit is archived', () => {
    const archived = habit({ archivedOn: '2026-09-29' })
    expect(dayStatus(archived, ticks(), '2026-09-28', TODAY)).toBe('missed')
    expect(dayStatus(archived, ticks(), '2026-09-29', TODAY)).toBe('off')
  })
})

describe('streaks', () => {
  const h = habit({ createdOn: '2026-09-20' })

  it('keeps a streak alive while today is still pending', () => {
    expect(currentStreak(h, ticks('2026-09-28', '2026-09-29'), TODAY)).toBe(2)
  })

  it('counts today once it is done', () => {
    expect(currentStreak(h, ticks('2026-09-28', '2026-09-29', TODAY), TODAY)).toBe(3)
  })

  it('breaks on a missed day', () => {
    expect(currentStreak(h, ticks('2026-09-27', TODAY), TODAY)).toBe(1)
  })

  it('is not broken by days the habit is off', () => {
    const weekdays = habit({ createdOn: '2026-09-20', days: [0, 1, 2, 3, 4] })
    // Fri 25, (Sat 26, Sun 27 off), Mon 28, Tue 29.
    expect(currentStreak(weekdays, ticks('2026-09-25', '2026-09-28', '2026-09-29'), TODAY)).toBe(3)
  })

  it('remembers the best run', () => {
    expect(bestStreak(h, ticks('2026-09-20', '2026-09-21', '2026-09-22', '2026-09-25'), TODAY)).toBe(3)
  })
})

describe('tally and labels', () => {
  it('counts done and missed, not pending or off days', () => {
    const h = habit({ createdOn: '2026-09-28' })
    expect(tally(h, ticks('2026-09-28'), '2026-09-01', TODAY, TODAY)).toEqual({ done: 1, missed: 1 })
  })

  it('labels by the last 30 days, and waits for enough days', () => {
    expect(habitLabel({ done: 9, missed: 1 })).toBe('strong')
    expect(habitLabel({ done: 6, missed: 4 })).toBe('slipping')
    expect(habitLabel({ done: 2, missed: 8 })).toBe('neglected')
    expect(habitLabel({ done: 3, missed: 1 })).toBe('new')
  })
})

describe('verdict', () => {
  it('compares this week with last week', () => {
    const h = habit({ createdOn: '2026-09-21' })
    // Last week (21-27): 7 of 7 would be 100%; tick 21-24 only -> 4 of 7.
    // This week (28-30): 28 and 29 done, 30 pending -> 2 of 2.
    const checks = new Map([['h1', ticks('2026-09-21', '2026-09-22', '2026-09-23', '2026-09-24', '2026-09-28', '2026-09-29')]])
    const v = verdict([h], checks, TODAY)
    expect(v.thisWeek).toEqual({ done: 2, missed: 0 })
    expect(v.lastWeek).toEqual({ done: 4, missed: 3 })
    expect(v.trend).toBe(43)
  })

  it('keeps archived habits in the record', () => {
    const archived = habit({ createdOn: '2026-09-28', archivedOn: TODAY })
    expect(verdict([archived], new Map(), TODAY).allTime).toEqual({ done: 0, missed: 2 })
  })
})

describe('bestWeekday', () => {
  it('needs enough data, then picks the most consistent weekday', () => {
    const h = habit({ createdOn: '2026-09-01' })
    expect(bestWeekday([h], new Map(), '2026-09-03')).toBeNull()
    // Tick every Tuesday in September.
    const tuesdays = ticks('2026-09-01', '2026-09-08', '2026-09-15', '2026-09-22', '2026-09-29')
    expect(bestWeekday([h], new Map([['h1', tuesdays]]), TODAY)).toBe(1)
  })
})

describe('habitCalendar and habitsDueOn', () => {
  it('lays out Monday-first weeks ending this week', () => {
    const grid = habitCalendar(habit(), ticks(TODAY), TODAY, 2)
    expect(grid).toHaveLength(2)
    expect(grid[1][0].day).toBe('2026-09-28')
    expect(grid[1][2].status).toBe('done')
    expect(grid[1][3].status).toBe('future')
  })

  it('lists only habits due that day, in order', () => {
    const habits = [
      habit({ id: 'b', sortOrder: 2 }),
      habit({ id: 'a', sortOrder: 1 }),
      habit({ id: 'weekend', days: [5, 6] }),
      habit({ id: 'archived', archivedOn: '2026-09-15' }),
    ]
    expect(habitsDueOn(habits, TODAY).map((h) => h.id)).toEqual(['a', 'b'])
  })
})

describe('moveItem', () => {
  it('moves an item down, up, or leaves it', () => {
    expect(moveItem(['a', 'b', 'c', 'd'], 0, 2)).toEqual(['b', 'c', 'a', 'd'])
    expect(moveItem(['a', 'b', 'c', 'd'], 3, 1)).toEqual(['a', 'd', 'b', 'c'])
    expect(moveItem(['a', 'b'], 1, 1)).toEqual(['a', 'b'])
  })
})

describe('describeDays', () => {
  it('names common schedules', () => {
    expect(describeDays(EVERY_DAY)).toBe('Every day')
    expect(describeDays([4, 0, 1, 2, 3])).toBe('Weekdays')
    expect(describeDays([5, 6])).toBe('Weekends')
    expect(describeDays([0, 2, 4])).toBe('Mon, Wed, Fri')
  })
})
