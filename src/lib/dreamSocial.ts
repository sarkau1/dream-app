import { friendlyError } from './errors'
import { supabase } from './supabaseClient'

// Private notes, reactions and comments on a single dream (supabase/schema.sql). Only the
// dream's own page uses these, so they're plain requests rather than part of DreamPostContext.
// Every caller is behind a loaded dream, so Supabase is known to be configured and signed in.

/** Mirrors dream_comments_body_length in supabase/schema.sql. */
export const MAX_COMMENT_LENGTH = 1000
/** Mirrors dream_notes_body_length in supabase/schema.sql. */
export const MAX_NOTE_LENGTH = 20000

export interface DreamComment {
  id: string
  userId: string
  authorName: string
  body: string
  createdAt: string
}

type Result = Promise<{ error: string | null }>

function toError(error: { message: string } | null) {
  return { error: error ? friendlyError(error.message) : null }
}

export async function fetchNote(dreamId: string) {
  const { data, error } = await supabase
    .from('dream_notes')
    .select('body')
    .eq('dream_id', dreamId)
    .maybeSingle()
  return { note: (data?.body as string | undefined) ?? '', ...toError(error) }
}

/** Saves the note, or removes it when `body` is blank. */
export async function saveNote(dreamId: string, userId: string, body: string): Result {
  const text = body.trim()
  const { error } = text
    ? await supabase
        .from('dream_notes')
        .upsert(
          { dream_id: dreamId, user_id: userId, body: text, updated_at: new Date().toISOString() },
          { onConflict: 'dream_id' },
        )
    : await supabase.from('dream_notes').delete().eq('dream_id', dreamId)
  return toError(error)
}

export async function fetchReactions(dreamId: string, userId: string) {
  const { data, error } = await supabase
    .from('dream_reactions')
    .select('user_id')
    .eq('dream_id', dreamId)
  const rows = (data ?? []) as { user_id: string }[]
  return {
    count: rows.length,
    mine: rows.some((row) => row.user_id === userId),
    ...toError(error),
  }
}

export async function setReaction(dreamId: string, userId: string, on: boolean): Result {
  const { error } = on
    ? await supabase.from('dream_reactions').insert({ dream_id: dreamId, user_id: userId })
    : await supabase.from('dream_reactions').delete().eq('dream_id', dreamId).eq('user_id', userId)
  return toError(error)
}

export async function fetchComments(dreamId: string) {
  const { data, error } = await supabase
    .from('dream_comments_with_authors')
    .select('id, user_id, author_name, body, created_at')
    .eq('dream_id', dreamId)
    .order('created_at', { ascending: true })
  const rows = (data ?? []) as {
    id: string
    user_id: string
    author_name: string
    body: string
    created_at: string
  }[]
  const comments: DreamComment[] = rows.map((row) => ({
    id: row.id,
    userId: row.user_id,
    authorName: row.author_name,
    body: row.body,
    createdAt: row.created_at,
  }))
  return { comments, ...toError(error) }
}

export async function addComment(dreamId: string, userId: string, body: string): Result {
  const { error } = await supabase
    .from('dream_comments')
    .insert({ dream_id: dreamId, user_id: userId, body: body.trim() })
  return toError(error)
}

export async function deleteComment(id: string): Result {
  const { error } = await supabase.from('dream_comments').delete().eq('id', id)
  return toError(error)
}
