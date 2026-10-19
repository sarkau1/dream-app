import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../context/useAuth'
import { friendlyError } from './errors'
import { isSupabaseConfigured, supabase } from './supabaseClient'

// Reads and writes the private blank_nights table (supabase/schema.sql): nights the dreamer
// checked in but remembered nothing. Shown on the Progress calendar; never counted as a dream.

/** The signed-in user's blank nights ("YYYY-MM-DD"), and a way to mark or unmark one. */
export function useBlankNights() {
  const userId = useAuth().user?.id ?? null
  const [nights, setNights] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (!isSupabaseConfigured || !userId) {
      setNights(new Set())
      return
    }
    let cancelled = false
    void supabase
      .from('blank_nights')
      .select('night')
      .eq('user_id', userId)
      .then(({ data, error }) => {
        // Before schema.sql has been re-run the table is missing; just show no blank nights.
        if (cancelled || error) return
        setNights(new Set((data ?? []).map((row: { night: string }) => row.night)))
      })
    return () => {
      cancelled = true
    }
  }, [userId])

  const setBlank = useCallback(
    async (night: string, blank: boolean): Promise<{ error: string | null }> => {
      if (!userId) return { error: 'Log in first.' }
      const { error } = blank
        ? await supabase
            .from('blank_nights')
            .upsert({ user_id: userId, night }, { onConflict: 'user_id,night', ignoreDuplicates: true })
        : await supabase.from('blank_nights').delete().eq('user_id', userId).eq('night', night)
      if (error) return { error: friendlyError(error.message) }
      setNights((prev) => {
        const next = new Set(prev)
        if (blank) next.add(night)
        else next.delete(night)
        return next
      })
      return { error: null }
    },
    [userId],
  )

  return { nights, setBlank }
}
