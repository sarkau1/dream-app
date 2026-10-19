// The waking-life notebook: thoughts, reading notes and ideas, kept apart from dreams.

export const THOUGHT_KINDS = ['Thought', 'Reading', 'Idea', 'Reflection'] as const
export type ThoughtKind = (typeof THOUGHT_KINDS)[number]

// Mirrors the check constraints on public.thoughts in supabase/schema.sql; change both together.
export const MAX_THOUGHT_TITLE_LENGTH = 200
export const MAX_THOUGHT_BODY_LENGTH = 20000
export const MAX_THOUGHT_TAGS = 30

/** The user-editable fields of a thought, as written by ThoughtForm. */
export interface ThoughtInput {
  title: string
  body: string
  kind: ThoughtKind | null
  tags: string[]
  /** The day it was written about, "YYYY-MM-DD" (see lib/dates). */
  writtenOn: string
}

export interface Thought extends ThoughtInput {
  id: string
  createdAt: string
}
