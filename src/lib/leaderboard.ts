import { friendlyError } from './errors'
import { supabase } from './supabaseClient'

export interface LeaderboardEntry {
  userId: string
  displayName: string
  dreamCount: number
  /** 1 is the most dreams; dreamers with the same count share a rank. */
  rank: number
}

/** The top 10 dreamers by dreams logged, plus the signed-in user's own row (dream_leaderboard). */
export async function fetchLeaderboard() {
  const { data, error } = await supabase.rpc('dream_leaderboard')
  const rows = (data ?? []) as {
    user_id: string
    display_name: string
    dream_count: number
    rank: number
  }[]
  const entries: LeaderboardEntry[] = rows.map((row) => ({
    userId: row.user_id,
    displayName: row.display_name,
    dreamCount: Number(row.dream_count),
    rank: Number(row.rank),
  }))
  return { entries, error: error ? friendlyError(error.message) : null }
}
