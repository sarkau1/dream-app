export interface DreamJournalEntry {
  date: string
  recalled: boolean
  note: string
  dreamSigns: string[]
  realityChecks: number
}

export interface DreamStreakSummary {
  currentStreak: number
  longestStreak: number
  totalRecalled: number
}
