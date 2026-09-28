import { describe, expect, it } from 'vitest'
import { CALENDAR_WEEKS, progressFromDreams } from './progress'
import type { DreamPost } from '../types/dream'

type D = Pick<DreamPost, 'dreamtOn' | 'mood' | 'symbols'>

function dream(dreamtOn: string, mood: DreamPost['mood'] = null, symbols: string[] = []): D {
  return { dreamtOn, mood, symbols }
}

// A Wednesday.
const TODAY = '2026-09-30'

describe('progressFromDreams', () => {
  it('counts a streak that ends today', () => {
    const p = progressFromDreams(
      [dream('2026-09-28'), dream('2026-09-29'), dream('2026-09-30'), dream('2026-09-30')],
      TODAY,
    )
    expect(p.currentStreak).toBe(3)
    expect(p.longestStreak).toBe(3)
    expect(p.nights).toBe(3)
    expect(p.dreams).toBe(4)
    expect(p.loggedToday).toBe(true)
  })

  it('keeps a streak alive until today is over', () => {
    const p = progressFromDreams([dream('2026-09-28'), dream('2026-09-29')], TODAY)
    expect(p.currentStreak).toBe(2)
    expect(p.loggedToday).toBe(false)
  })

  it('breaks the streak after a missed night but remembers the longest', () => {
    const p = progressFromDreams(
      [dream('2026-09-01'), dream('2026-09-02'), dream('2026-09-03'), dream('2026-09-28')],
      TODAY,
    )
    expect(p.currentStreak).toBe(0)
    expect(p.longestStreak).toBe(3)
  })

  it('counts streaks across a month boundary and ignores future-dated dreams', () => {
    const p = progressFromDreams(
      [dream('2026-08-31'), dream('2026-09-01'), dream('2026-10-05')],
      '2026-09-01',
    )
    expect(p.currentStreak).toBe(2)
    expect(p.nights).toBe(2)
  })

  it('lays the calendar out in Monday-first weeks ending with this one', () => {
    const p = progressFromDreams([dream(TODAY, 'Lucid')], TODAY)
    expect(p.calendar).toHaveLength(CALENDAR_WEEKS)
    const thisWeek = p.calendar[CALENDAR_WEEKS - 1]
    expect(thisWeek[0].day).toBe('2026-09-28')
    expect(thisWeek[2]).toEqual({ day: TODAY, dreams: 1, lucid: true, future: false })
    expect(thisWeek[3].future).toBe(true)
  })

  it('ranks dream signs case-insensitively, once per dream', () => {
    const p = progressFromDreams(
      [dream(TODAY, null, ['Teeth', 'teeth']), dream(TODAY, null, ['teeth', 'water']), dream(TODAY, null, ['water'])],
      TODAY,
    )
    expect(p.topSigns).toEqual([
      { sign: 'teeth', count: 2 },
      { sign: 'water', count: 2 },
    ])
  })

  it('tracks milestone progress', () => {
    const p = progressFromDreams([dream('2026-09-29', 'Lucid'), dream(TODAY)], TODAY)
    const byId = Object.fromEntries(p.milestones.map((m) => [m.id, m]))
    expect(byId['first-dream'].value).toBeGreaterThanOrEqual(byId['first-dream'].target)
    expect(byId['first-lucid'].value).toBe(1)
    expect(byId['week-streak'].value).toBe(2)
    expect(p.moods.find((m) => m.mood === null)?.count).toBe(1)
  })
})
