import { friendlyError } from './errors'
import { isSupabaseConfigured, NOT_CONFIGURED_ERROR, supabase } from './supabaseClient'
import type { Thought, ThoughtInput, ThoughtKind } from '../types/thought'

// Reads and writes the private thoughts table (supabase/schema.sql). Only the writer can see
// their thoughts; the database enforces it.

interface ThoughtRow {
  id: string
  title: string
  body: string
  kind: string | null
  tags: string[] | null
  written_on: string
  created_at: string
}

const COLUMNS = 'id, title, body, kind, tags, written_on, created_at'

const toThought = (row: ThoughtRow): Thought => ({
  id: row.id,
  title: row.title,
  body: row.body,
  kind: row.kind as ThoughtKind | null,
  tags: row.tags ?? [],
  writtenOn: row.written_on,
  createdAt: row.created_at,
})

const toRow = (input: ThoughtInput) => ({
  title: input.title.trim(),
  body: input.body.trim(),
  kind: input.kind,
  tags: input.tags,
  written_on: input.writtenOn,
})

const toError = (error: { message: string } | null) => (error ? friendlyError(error.message) : null)

/** Every thought, newest day first. */
export async function fetchThoughts(userId: string) {
  if (!isSupabaseConfigured) return { thoughts: [] as Thought[], error: NOT_CONFIGURED_ERROR }
  const { data, error } = await supabase
    .from('thoughts')
    .select(COLUMNS)
    .eq('user_id', userId)
    .order('written_on', { ascending: false })
    .order('created_at', { ascending: false })
  return { thoughts: ((data ?? []) as ThoughtRow[]).map(toThought), error: toError(error) }
}

export async function fetchThought(id: string) {
  const { data, error } = await supabase.from('thoughts').select(COLUMNS).eq('id', id).maybeSingle()
  return { thought: data ? toThought(data as ThoughtRow) : null, error: toError(error) }
}

export async function createThought(userId: string, input: ThoughtInput) {
  const { data, error } = await supabase
    .from('thoughts')
    .insert({ user_id: userId, ...toRow(input) })
    .select('id')
    .single()
  return { id: (data as { id: string } | null)?.id ?? null, error: toError(error) }
}

export async function updateThought(id: string, input: ThoughtInput) {
  const { error } = await supabase.from('thoughts').update(toRow(input)).eq('id', id)
  return { error: toError(error) }
}

export async function deleteThought(id: string) {
  const { data, error } = await supabase.from('thoughts').delete().eq('id', id).select('id')
  if (error) return { error: toError(error) }
  if (!data?.length) return { error: 'That thought could not be found. It may already be gone.' }
  return { error: null }
}
