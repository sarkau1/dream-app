import { friendlyError } from './errors'
import { supabase } from './supabaseClient'
import { symbolsByFrequency } from './symbols'
import type { DreamMood } from '../types/dream'

/** A dreamer's public page header: their name and a few numbers from their shared dreams. */
export interface Dreamer {
  userId: string
  displayName: string
  sharedCount: number
  lucidCount: number
  /** Most tagged signs across their shared dreams, most used first. */
  topSigns: string[]
  /** When they first shared a dream (ISO), or null if they haven't. */
  sharingSince: string | null
}

const TOP_SIGNS = 5

/**
 * Only shared dreams count: the query asks for them explicitly, so a dreamer looking at their
 * own page sees what everyone else sees rather than their private numbers too.
 */
export async function fetchDreamer(userId: string) {
  const [profileResult, dreamsResult] = await Promise.all([
    supabase.from('profiles').select('display_name').eq('user_id', userId).maybeSingle(),
    supabase
      .from('dreams')
      .select('mood, symbols, created_at')
      .eq('user_id', userId)
      .eq('is_private', false)
      .order('created_at', { ascending: true }),
  ])
  const error = profileResult.error ?? dreamsResult.error
  if (error) return { dreamer: null, error: friendlyError(error.message) }

  const dreams = (dreamsResult.data ?? []) as {
    mood: DreamMood | null
    symbols: string[] | null
    created_at: string
  }[]
  // No profile and nothing shared: there's no one here to show.
  if (!profileResult.data && dreams.length === 0) return { dreamer: null, error: null }

  const dreamer: Dreamer = {
    userId,
    displayName: (profileResult.data?.display_name as string | undefined) ?? 'Dreamer',
    sharedCount: dreams.length,
    lucidCount: dreams.filter((dream) => dream.mood === 'Lucid').length,
    topSigns: symbolsByFrequency(
      dreams.map((dream) => ({ symbols: dream.symbols ?? [] })),
    ).slice(0, TOP_SIGNS),
    sharingSince: dreams[0]?.created_at ?? null,
  }
  return { dreamer, error: null }
}
