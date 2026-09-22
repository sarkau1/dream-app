import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { isSupabaseConfigured, supabase } from '../lib/supabaseClient'
import { useAuth } from './AuthContext'
import type { DreamPost } from '../types/dream'

const NOT_CONFIGURED_ERROR =
  'This site is not connected to Supabase yet. See README.md to set it up.'

interface DreamPostContextValue {
  dreams: DreamPost[]
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
  createDream: (title: string, body: string) => Promise<{ error: string | null }>
}

const DreamPostContext = createContext<DreamPostContextValue | undefined>(undefined)

export function DreamPostProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [dreams, setDreams] = useState<DreamPost[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (!isSupabaseConfigured) {
      setDreams([])
      setError(NOT_CONFIGURED_ERROR)
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    const { data: dreamRows, error: dreamsError } = await supabase
      .from('dreams')
      .select('id, user_id, title, body, created_at')
      .order('created_at', { ascending: false })

    if (dreamsError) {
      setError(dreamsError.message)
      setLoading(false)
      return
    }

    const userIds = [...new Set((dreamRows ?? []).map((row) => row.user_id))]
    const { data: profileRows } = userIds.length
      ? await supabase.from('profiles').select('user_id, display_name').in('user_id', userIds)
      : { data: [] as { user_id: string; display_name: string }[] }

    const nameByUserId = new Map((profileRows ?? []).map((p) => [p.user_id, p.display_name]))

    setDreams(
      (dreamRows ?? []).map((row) => ({
        id: row.id,
        userId: row.user_id,
        authorName: nameByUserId.get(row.user_id) ?? 'Dreamer',
        title: row.title,
        body: row.body,
        createdAt: row.created_at,
      })),
    )
    setLoading(false)
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  async function createDream(title: string, body: string) {
    if (!isSupabaseConfigured) return { error: NOT_CONFIGURED_ERROR }
    if (!user) return { error: 'You must be logged in to post a dream.' }

    const { error } = await supabase.from('dreams').insert({
      user_id: user.id,
      title,
      body,
    })
    if (error) return { error: error.message }

    await refresh()
    return { error: null }
  }

  return (
    <DreamPostContext.Provider value={{ dreams, loading, error, refresh, createDream }}>
      {children}
    </DreamPostContext.Provider>
  )
}

export function useDreamPosts() {
  const ctx = useContext(DreamPostContext)
  if (!ctx) throw new Error('useDreamPosts must be used within a DreamPostProvider')
  return ctx
}
