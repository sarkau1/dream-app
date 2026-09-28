import { friendlyError } from './errors'
import { supabase } from './supabaseClient'

// Reports and the admin actions (report_content(), admin_*() and the tables they use in
// supabase/schema.sql). The database checks who may do what; these just make the calls.

/** Mirrors the reason check on public.reports. */
export const REPORT_REASONS = [
  { value: 'spam', label: 'Spam or advertising' },
  { value: 'harassment', label: 'Harassment or bullying' },
  { value: 'inappropriate', label: 'Inappropriate or offensive' },
  { value: 'other', label: 'Something else' },
] as const

export type ReportReason = (typeof REPORT_REASONS)[number]['value']
export type ReportKind = 'dream' | 'comment' | 'user'

/** Mirrors the details check on public.reports. */
export const MAX_REPORT_DETAILS = 500

type Result = Promise<{ error: string | null }>

const toError = (error: { message: string } | null) => ({
  error: error ? friendlyError(error.message) : null,
})

async function call(fn: string, args?: Record<string, unknown>): Result {
  const { error } = await supabase.rpc(fn, args)
  return toError(error)
}

/** `target` is the dream, comment or user id, matching `kind`. */
export function reportContent(kind: ReportKind, target: string, reason: ReportReason, details: string) {
  return call('report_content', { kind, target, reason, details: details.trim() || null })
}

export const hideDream = (dreamId: string, reason: string) =>
  call('admin_hide_dream', { dream: dreamId, reason })
export const unhideDream = (dreamId: string) => call('admin_unhide_dream', { dream: dreamId })
export const suspendUser = (userId: string, reason: string) =>
  call('admin_suspend_user', { target: userId, reason })
export const unsuspendUser = (userId: string) => call('admin_unsuspend_user', { target: userId })
export const resetDisplayName = (userId: string) =>
  call('admin_reset_display_name', { target: userId })
export const closeReport = (reportId: string, outcome: 'resolved' | 'dismissed') =>
  call('admin_close_report', { report: reportId, outcome })

export interface Overview {
  users: number
  new_users_7d: number
  active_users_7d: number
  dreams: number
  dreams_7d: number
  lucid_dreams: number
  shared_dreams: number
  comments_7d: number
  open_reports: number
  suspended_users: number
  hidden_dreams: number
}

export async function fetchOverview() {
  const { data, error } = await supabase.rpc('admin_overview')
  return { overview: (data as Overview | null) ?? null, ...toError(error) }
}

export interface Report {
  id: string
  kind: ReportKind
  reason: ReportReason
  details: string | null
  createdAt: string
  reporterName: string
  reportedUserId: string
  reportedUserName: string
  reportedUserSuspended: boolean
  dreamId: string | null
  dreamTitle: string | null
  dreamPreview: string | null
  dreamHidden: boolean
  commentId: string | null
  commentBody: string | null
}

export async function fetchOpenReports() {
  const { data, error } = await supabase
    .from('reports_with_details')
    .select(
      'id, kind, reason, details, created_at, reporter_name, reported_user_id, reported_user_name, reported_user_suspended, dream_id, dream_title, dream_preview, dream_hidden_at, comment_id, comment_body, comment_dream_id',
    )
    .eq('status', 'open')
    .order('created_at', { ascending: true })
  const rows = (data ?? []) as Record<string, unknown>[]
  const reports: Report[] = rows.map((row) => ({
    id: row.id as string,
    kind: row.kind as ReportKind,
    reason: row.reason as ReportReason,
    details: (row.details as string | null) ?? null,
    createdAt: row.created_at as string,
    reporterName: row.reporter_name as string,
    reportedUserId: row.reported_user_id as string,
    reportedUserName: row.reported_user_name as string,
    reportedUserSuspended: row.reported_user_suspended as boolean,
    // A comment report links to the dream the comment is on.
    dreamId: ((row.dream_id ?? row.comment_dream_id) as string | null) ?? null,
    dreamTitle: (row.dream_title as string | null) ?? null,
    dreamPreview: (row.dream_preview as string | null) ?? null,
    dreamHidden: row.dream_hidden_at != null,
    commentId: (row.comment_id as string | null) ?? null,
    commentBody: (row.comment_body as string | null) ?? null,
  }))
  return { reports, ...toError(error) }
}

export interface Suspension {
  userId: string
  displayName: string
  reason: string
  since: string
}

export async function fetchSuspensions() {
  const { data, error } = await supabase
    .from('user_suspensions')
    .select('user_id, reason, created_at')
    .order('created_at', { ascending: false })
  if (error) return { suspensions: [] as Suspension[], ...toError(error) }
  const rows = (data ?? []) as { user_id: string; reason: string; created_at: string }[]
  const names = await profileNames(rows.map((row) => row.user_id))
  const suspensions: Suspension[] = rows.map((row) => ({
    userId: row.user_id,
    displayName: names.get(row.user_id) ?? 'Dreamer',
    reason: row.reason,
    since: row.created_at,
  }))
  return { suspensions, error: null }
}

async function profileNames(userIds: string[]) {
  if (userIds.length === 0) return new Map<string, string>()
  const { data } = await supabase.from('profiles').select('user_id, display_name').in('user_id', userIds)
  const rows = (data ?? []) as { user_id: string; display_name: string }[]
  return new Map(rows.map((row) => [row.user_id, row.display_name]))
}

/** One user's suspension, for an admin looking at their page; null if not suspended. */
export async function fetchSuspension(userId: string) {
  const { data, error } = await supabase
    .from('user_suspensions')
    .select('reason, created_at')
    .eq('user_id', userId)
    .maybeSingle()
  const row = data as { reason: string; created_at: string } | null
  return { suspension: row ? { reason: row.reason, since: row.created_at } : null, ...toError(error) }
}

export interface HiddenDream {
  id: string
  title: string
  authorName: string
  hiddenReason: string | null
  hiddenAt: string
}

export async function fetchHiddenDreams() {
  const { data, error } = await supabase
    .from('dreams_with_authors')
    .select('id, title, author_name, hidden_reason, hidden_at')
    .not('hidden_at', 'is', null)
    .order('hidden_at', { ascending: false })
  const rows = (data ?? []) as {
    id: string
    title: string
    author_name: string
    hidden_reason: string | null
    hidden_at: string
  }[]
  const dreams: HiddenDream[] = rows.map((row) => ({
    id: row.id,
    title: row.title,
    authorName: row.author_name,
    hiddenReason: row.hidden_reason,
    hiddenAt: row.hidden_at,
  }))
  return { dreams, ...toError(error) }
}

export interface DreamerMatch {
  userId: string
  displayName: string
}

// ilike treats % and _ as wildcards; a search for "100%" should look for the literal text.
const escapeLike = (text: string) => text.replace(/[\\%_]/g, (char) => `\\${char}`)

export async function searchDreamers(query: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('user_id, display_name')
    .ilike('display_name', `%${escapeLike(query.trim())}%`)
    .order('display_name')
    .limit(20)
  const rows = (data ?? []) as { user_id: string; display_name: string }[]
  return {
    dreamers: rows.map((row) => ({ userId: row.user_id, displayName: row.display_name })),
    ...toError(error),
  }
}
