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
  /**
   * The dream's picture in the dream-images storage bucket ("<user id>/<file>"), or null.
   * Left out (undefined) by writes that don't touch the picture.
   */
  imagePath?: string | null
}

export interface DreamPost extends DreamInput {
  id: string
  userId: string
  authorName: string
  createdAt: string
  /** Set when a moderator took this shared dream out of the feed. */
  hiddenAt?: string | null
  hiddenReason?: string | null
  /** True for your own dreams while you're suspended, or, for admins, a suspended user's. */
  authorSuspended?: boolean
  /** Only loaded for lists of shared dreams (the Dream Feed and dreamer pages). */
  commentCount?: number
  reactionCount?: number
  reactedByMe?: boolean
}

/** A dream in the account export, with the dreamer's private note on it if they wrote one. */
export interface ExportedDream extends DreamPost {
  note?: string
}

export type FeedPeriod = 'all' | 'week' | 'month' | 'year'

/** Narrows the Dream Feed; applied in the database since the feed loads a page at a time. */
export interface FeedFilter {
  mood: DreamMood | null
  /** How far back the dream was dreamt. */
  period: FeedPeriod
}

export const ALL_DREAMS_FILTER: FeedFilter = { mood: null, period: 'all' }

/** Characters of the body kept in a DreamSummary; mirrors `left(body, 400)` in schema.sql. */
export const PREVIEW_LENGTH = 400

/**
 * A dream as listed in the journal: everything but the full body, which only the dream's own
 * page (and the export) downloads.
 */
export interface DreamSummary extends Omit<DreamPost, 'body'> {
  preview: string
}
