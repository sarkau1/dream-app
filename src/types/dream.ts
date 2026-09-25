export const DREAM_MOODS = ['Lucid', 'Nightmare', 'Recurring', 'Peaceful', 'Confusing'] as const
export type DreamMood = (typeof DREAM_MOODS)[number]

// Mirrors the check constraints in supabase/schema.sql; change both together.
export const MAX_TITLE_LENGTH = 200
export const MAX_BODY_LENGTH = 20000
export const MAX_SYMBOLS = 30
export const MAX_DISPLAY_NAME_LENGTH = 50

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

/** Characters of the body kept in a DreamSummary; mirrors `left(body, 400)` in schema.sql. */
export const PREVIEW_LENGTH = 400

/**
 * A dream as listed in the journal: everything but the full body, which only the dream's own
 * page (and the export) downloads.
 */
export interface DreamSummary extends Omit<DreamPost, 'body'> {
  preview: string
}
