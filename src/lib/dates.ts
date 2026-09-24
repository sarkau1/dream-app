// Dream dates are calendar days ("YYYY-MM-DD") with no time or timezone. Always build them from
// local date parts: `new Date('2026-09-24')` parses as UTC midnight and shows the previous day
// for anyone west of Greenwich.

/** Today's date in the user's own timezone, as "YYYY-MM-DD". */
export function todayLocal(): string {
  const now = new Date()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${now.getFullYear()}-${month}-${day}`
}

function parseDay(day: string): Date {
  const [year, month, date] = day.split('-').map(Number)
  return new Date(year, month - 1, date)
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
