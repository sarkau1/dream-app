import { friendlyError } from './errors'
import type { Habit, HabitChecks } from './habits'
import { supabase } from './supabaseClient'

// Reads and writes the private habits and habit_checks tables (supabase/schema.sql). The
// database enforces the honesty rules: no backdating, ticks only for today and yesterday.

type Result = Promise<{ error: string | null }>

const toError = (error: { message: string } | null) => ({
  error: error ? friendlyError(error.message) : null,
})

interface HabitRow {
  id: string
  name: string
  emoji: string | null
  days: number[]
  sort_order: number
  created_on: string
  archived_on: string | null
}

const HABIT_COLUMNS = 'id, name, emoji, days, sort_order, created_on, archived_on'

const toHabit = (row: HabitRow): Habit => ({
  id: row.id,
  name: row.name,
  emoji: row.emoji,
  days: row.days,
  sortOrder: row.sort_order,
  createdOn: row.created_on,
  archivedOn: row.archived_on,
})

// Supabase returns at most 1000 rows a request, and years of ticks can be more than that.
const PAGE = 1000

async function fetchAllChecks(userId: string) {
  const rows: { habit_id: string; day: string }[] = []
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabase
      .from('habit_checks')
      .select('habit_id, day')
      .eq('user_id', userId)
      .order('day')
      .range(from, from + PAGE - 1)
    if (error) return { rows, error }
    rows.push(...((data ?? []) as typeof rows))
    if (!data || data.length < PAGE) return { rows, error: null }
  }
}

/** Every habit (archived ones too, since their history still counts) and every tick. */
export async function fetchHabits(userId: string) {
  const [habitsResult, checksResult] = await Promise.all([
    supabase
      .from('habits')
      .select(HABIT_COLUMNS)
      .eq('user_id', userId)
      .order('sort_order')
      .order('created_at'),
    fetchAllChecks(userId),
  ])
  const error = habitsResult.error ?? checksResult.error
  const checks: HabitChecks = new Map()
  for (const row of checksResult.rows) {
    if (!checks.has(row.habit_id)) checks.set(row.habit_id, new Set())
    checks.get(row.habit_id)!.add(row.day)
  }
  return {
    habits: ((habitsResult.data ?? []) as HabitRow[]).map(toHabit),
    checks,
    ...toError(error),
  }
}

export interface HabitInput {
  name: string
  emoji: string | null
  days: number[]
}

export async function addHabit(userId: string, input: HabitInput, sortOrder: number, today: string) {
  const { data, error } = await supabase
    .from('habits')
    .insert({
      user_id: userId,
      name: input.name.trim(),
      emoji: input.emoji,
      days: input.days,
      sort_order: sortOrder,
      created_on: today,
    })
    .select(HABIT_COLUMNS)
    .single()
  return { habit: data ? toHabit(data as HabitRow) : null, ...toError(error) }
}

export async function updateHabit(id: string, input: HabitInput): Result {
  const { error } = await supabase
    .from('habits')
    .update({ name: input.name.trim(), emoji: input.emoji, days: input.days })
    .eq('id', id)
  return toError(error)
}

/** Archive (stop) a habit from `day`, or bring it back with null. */
export async function setArchived(id: string, day: string | null): Result {
  const { error } = await supabase.from('habits').update({ archived_on: day }).eq('id', id)
  return toError(error)
}

/** Only allowed for a habit added today (a typo); after that it can only be archived. */
export async function deleteHabit(id: string): Result {
  const { data, error } = await supabase.from('habits').delete().eq('id', id).select('id')
  if (error) return toError(error)
  if (!data?.length) return { error: 'Only a habit added today can be deleted. Archive it instead.' }
  return { error: null }
}

export async function setCheck(habitId: string, userId: string, day: string, done: boolean): Result {
  const { error } = done
    ? await supabase.from('habit_checks').insert({ habit_id: habitId, user_id: userId, day })
    : await supabase.from('habit_checks').delete().eq('habit_id', habitId).eq('day', day)
  return toError(error)
}
