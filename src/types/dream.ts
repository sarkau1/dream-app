export const DREAM_MOODS = ['Lucid', 'Nightmare', 'Recurring', 'Peaceful', 'Confusing'] as const
export type DreamMood = (typeof DREAM_MOODS)[number]

/** The user-editable fields of a dream, as written by DreamForm. */
export interface DreamInput {
  title: string
  body: string
  mood: DreamMood | null
  symbols: string[]
  isPrivate: boolean
  /** The night the dream happened, "YYYY-MM-DD" (see lib/dates). */
  dreamtOn: string
}

export interface DreamPost extends DreamInput {
  id: string
  userId: string
  authorName: string
  createdAt: string
}
