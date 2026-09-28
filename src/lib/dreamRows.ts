import { addDays, todayLocal } from './dates'
import { supabase } from './supabaseClient'
import {
  PREVIEW_LENGTH,
  type DreamInput,
  type DreamMood,
  type DreamPost,
  type DreamSummary,
  type FeedFilter,
  type FeedPeriod,
} from '../types/dream'

// Reads go through the dreams_with_authors view (supabase/schema.sql), which adds the author's
// display name, a text preview and comment/reaction counts, so a page of dreams is one request.
// Writes go to `dreams`.
export const DREAMS_VIEW = 'dreams_with_authors'
const BASE_COLUMNS =
  'id, user_id, title, mood, symbols, is_private, dreamt_on, created_at, author_name, hidden_at, hidden_reason, author_suspended'
export const FULL_COLUMNS = `${BASE_COLUMNS}, body`
const SHARED_COLUMNS = `${FULL_COLUMNS}, comment_count, reaction_count, reacted_by_me`
export const SUMMARY_COLUMNS = `${BASE_COLUMNS}, preview`
export const WRITE_COLUMNS = 'id, user_id, title, body, mood, symbols, is_private, dreamt_on, created_at'

export const SHARED_PAGE_SIZE = 10

interface BaseRow {
  id: string
  user_id: string
  title: string
  mood: string | null
  symbols: string[] | null
  is_private: boolean
  dreamt_on: string
  created_at: string
  // Only from the view, not from writes to `dreams`.
  hidden_at?: string | null
  hidden_reason?: string | null
  author_suspended?: boolean
}

type PostRow = BaseRow & {
  body: string
  author_name?: string
  comment_count?: number
  reaction_count?: number
  reacted_by_me?: boolean
}

export function toRow(input: DreamInput) {
  return {
    title: input.title,
    body: input.body,
    mood: input.mood,
    symbols: input.symbols,
    is_private: input.isPrivate,
    dreamt_on: input.dreamtOn,
  }
}

function fromBase(row: BaseRow, authorName: string) {
  return {
    id: row.id,
    userId: row.user_id,
    authorName,
    title: row.title,
    mood: (row.mood as DreamMood | null) ?? null,
    symbols: row.symbols ?? [],
    isPrivate: row.is_private,
    dreamtOn: row.dreamt_on,
    createdAt: row.created_at,
    hiddenAt: row.hidden_at ?? null,
    hiddenReason: row.hidden_reason ?? null,
    authorSuspended: row.author_suspended ?? false,
  }
}

export function toPost(row: PostRow, authorName?: string): DreamPost {
  const post: DreamPost = {
    ...fromBase(row, authorName ?? row.author_name ?? 'Dreamer'),
    body: row.body,
  }
  if (row.comment_count !== undefined) post.commentCount = row.comment_count
  if (row.reaction_count !== undefined) post.reactionCount = row.reaction_count
  if (row.reacted_by_me !== undefined) post.reactedByMe = row.reacted_by_me
  return post
}

export function toSummary(row: BaseRow & { preview: string; author_name: string }): DreamSummary {
  return { ...fromBase(row, row.author_name), preview: row.preview }
}

export function summarize({ body, ...rest }: DreamPost): DreamSummary {
  return { ...rest, preview: body.slice(0, PREVIEW_LENGTH) }
}

/**
 * A just-saved dream for the feed. Writes don't return the counts, so it keeps the ones the
 * feed already showed for it; a brand new dream has none yet.
 */
export function withKnownCounts(post: DreamPost, previous: DreamPost | undefined): DreamPost {
  return {
    ...post,
    commentCount: previous?.commentCount ?? 0,
    reactionCount: previous?.reactionCount ?? 0,
    reactedByMe: previous?.reactedByMe ?? false,
  }
}

// Journal order: by the night dreamt, newest first, then by when it was written down.
export function byDreamtOnDesc(a: DreamSummary, b: DreamSummary) {
  if (a.dreamtOn !== b.dreamtOn) return a.dreamtOn < b.dreamtOn ? 1 : -1
  return byCreatedAtDesc(a, b)
}

// Feed order: newest post first.
export function byCreatedAtDesc(a: { createdAt: string }, b: { createdAt: string }) {
  return a.createdAt < b.createdAt ? 1 : a.createdAt > b.createdAt ? -1 : 0
}

const PERIOD_DAYS: Record<Exclude<FeedPeriod, 'all'>, number> = { week: 7, month: 30, year: 365 }

/** The earliest night a filter lets through, or null for any time. */
function periodStart(period: FeedPeriod, today: string): string | null {
  return period === 'all' ? null : addDays(today, -PERIOD_DAYS[period])
}

export function isFiltered(filter: FeedFilter) {
  return filter.mood !== null || filter.period !== 'all'
}

/** The same test fetchSharedPage applies in the database, for dreams saved in the browser. */
export function matchesFilter(
  post: Pick<DreamPost, 'mood' | 'dreamtOn'>,
  filter: FeedFilter,
  today = todayLocal(),
) {
  if (filter.mood && post.mood !== filter.mood) return false
  const start = periodStart(filter.period, today)
  return start === null || post.dreamtOn >= start
}

/**
 * One page of shared dreams, newest first: the whole community's, or one dreamer's when
 * `userId` is given. `before` pages past the oldest dream already shown.
 */
export async function fetchSharedPage(
  filter: FeedFilter,
  { before, userId }: { before?: string; userId?: string } = {},
) {
  let query = supabase
    .from(DREAMS_VIEW)
    .select(SHARED_COLUMNS)
    .eq('is_private', false)
    // The database already keeps these from everyone but admins (and the dreamer); filtering
    // here keeps them out of an admin's feed too. Admins find them on the admin page.
    .is('hidden_at', null)
    .eq('author_suspended', false)
  if (userId) query = query.eq('user_id', userId)
  if (filter.mood) query = query.eq('mood', filter.mood)
  const start = periodStart(filter.period, todayLocal())
  if (start) query = query.gte('dreamt_on', start)
  // Page by "older than the last one shown" rather than by offset, so dreams posted while
  // someone is reading don't shift the pages and show up twice.
  if (before) query = query.lt('created_at', before)
  const { data, error } = await query.order('created_at', { ascending: false }).limit(SHARED_PAGE_SIZE)
  const dreams = ((data ?? []) as PostRow[]).map((row) => toPost(row))
  return { dreams, hasMore: dreams.length === SHARED_PAGE_SIZE, error }
}
