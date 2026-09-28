// Dream dates are calendar days ("YYYY-MM-DD") with no time or timezone. Always build them from
// local date parts: `new Date('2026-09-24')` parses as UTC midnight and shows the previous day
// for anyone west of Greenwich.

function toDay(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}

/** Today's date in the user's own timezone, as "YYYY-MM-DD". */
export function todayLocal(): string {
  return toDay(new Date())
}

function parseDay(day: string): Date {
  const [year, month, date] = day.split('-').map(Number)
  return new Date(year, month - 1, date)
}

/** The calendar day `days` after `day` (negative goes back); safe across DST changes. */
export function addDays(day: string, days: number): string {
  const date = parseDay(day)
  date.setDate(date.getDate() + days)
  return toDay(date)
}

/** Day of the week with Monday as 0 and Sunday as 6. */
export function weekdayIndex(day: string): number {
  return (parseDay(day).getDay() + 6) % 7
}

/** "Thu, Sep 24, 2026" */
export function formatDreamDate(day: string): string {
  return parseDay(day).toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

/** "September 2026", for grouping the journal by month. */
export function formatDreamMonth(day: string): string {
  return parseDay(day).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
}
