import { describe, expect, it } from 'vitest'
import { ESSENCE_PERFECT_DAY, essenceFromHabits, isPerfectDay } from './essence'
import { EVERY_DAY, type Habit, type HabitChecks } from './habits'

// 2026-09-28 is a Monday; "today" is Wednesday 2026-09-30.
const TODAY = '2026-09-30'

function habit(id: string, overrides: Partial<Habit> = {}): Habit {
  return {
    id,
    name: id,
    emoji: null,
    days: EVERY_DAY,
    sortOrder: 0,
    createdOn: '2026-09-28',
    archivedOn: null,
    ...overrides,
  }
}

const checks = (entries: Record<string, string[]>): HabitChecks =>
  new Map(Object.entries(entries).map(([id, days]) => [id, new Set(days)]))

describe('isPerfectDay', () => {
  it('needs every habit due that day ticked', () => {
    const habits = [habit('a'), habit('b')]
    expect(isPerfectDay(habits, checks({ a: [TODAY], b: [TODAY] }), TODAY)).toBe(true)
    expect(isPerfectDay(habits, checks({ a: [TODAY] }), TODAY)).toBe(false)
    expect(isPerfectDay(habits, checks({}), TODAY)).toBe(false)
  })

  it('ignores habits not scheduled that day', () => {
    // Monday only; today is a Wednesday.
    const habits = [habit('a'), habit('mondays', { days: [0] })]
    expect(isPerfectDay(habits, checks({ a: [TODAY] }), TODAY)).toBe(true)
  })

  it('is never perfect with nothing due', () => {
    expect(isPerfectDay([habit('mondays', { days: [0] })], checks({}), TODAY)).toBe(false)
  })
})

describe('essenceFromHabits', () => {
  it('gives essence only for fully completed days', () => {
    const habits = [habit('a'), habit('b')]
    const ticks = checks({
      a: ['2026-09-28', '2026-09-29', TODAY],
      b: ['2026-09-28', TODAY],
    })
    // Monday and Wednesday complete, Tuesday half done.
    expect(essenceFromHabits(habits, ticks, TODAY)).toBe(2 * ESSENCE_PERFECT_DAY)
  })

  it('is zero with no habits or no ticks', () => {
    expect(essenceFromHabits([], checks({}), TODAY)).toBe(0)
    expect(essenceFromHabits([habit('a')], checks({}), TODAY)).toBe(0)
  })

  it('keeps counting days completed before a habit was stopped', () => {
    const habits = [habit('a', { archivedOn: '2026-09-29' })]
    expect(essenceFromHabits(habits, checks({ a: ['2026-09-28'] }), TODAY)).toBe(ESSENCE_PERFECT_DAY)
  })
})
