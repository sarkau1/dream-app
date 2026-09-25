import { afterEach, describe, expect, it, vi } from 'vitest'
import { formatDreamDate, formatDreamMonth, todayLocal } from './dates'

afterEach(() => {
  vi.useRealTimers()
})

describe('dates', () => {
  it('builds today from local date parts, zero-padded', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 0, 5, 23, 30))
    expect(todayLocal()).toBe('2026-01-05')
  })

  it('formats a calendar day without shifting it by timezone', () => {
    // Parsing "2026-09-24" as UTC would show Sep 23 anywhere west of Greenwich.
    expect(formatDreamDate('2026-09-24')).toBe(
      new Date(2026, 8, 24).toLocaleDateString(undefined, {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }),
    )
    expect(formatDreamMonth('2026-09-01')).toBe(
      new Date(2026, 8, 1).toLocaleDateString(undefined, { month: 'long', year: 'numeric' }),
    )
  })
})
