import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Session, User } from '@supabase/auth-js'
import { clearAllDrafts } from '../lib/drafts'
import { isSupabaseConfigured, supabase } from '../lib/supabaseClient'

const NOT_CONFIGURED_ERROR =
  'This site is not connected to Supabase yet. See README.md to set it up.'

interface AuthContextValue {
  user: User | null
  session: Session | null
  loading: boolean
  signUp: (email: string, password: string, displayName: string) => Promise<{ error: string | null; needsEmailConfirmation: boolean }>
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
  requestPasswordReset: (email: string) => Promise<{ error: string | null }>
  updatePassword: (password: string) => Promise<{ error: string | null }>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

async function syncProfile(user: User) {
  const displayName =
    (user.user_metadata?.display_name as string | undefined) ?? user.email ?? 'Dreamer'
  await supabase.from('profiles').upsert({ user_id: user.id, display_name: displayName })
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false)
      return
    }

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })

    const { data: listener } = supabase.auth.onAuthStateChange((event, newSession) => {
      setSession(newSession)
      if (event === 'SIGNED_IN' && newSession?.user) {
        void syncProfile(newSession.user)
      }
    })

    return () => listener.subscription.unsubscribe()
  }, [])

  async function signUp(email: string, password: string, displayName: string) {
    if (!isSupabaseConfigured) return { error: NOT_CONFIGURED_ERROR, needsEmailConfirmation: false }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { display_name: displayName } },
    })
    if (error) return { error: error.message, needsEmailConfirmation: false }
    if (data.user && !data.session) {
      return { error: null, needsEmailConfirmation: true }
    }
    return { error: null, needsEmailConfirmation: false }
  }

  async function signIn(email: string, password: string) {
    if (!isSupabaseConfigured) return { error: NOT_CONFIGURED_ERROR }

    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error: error?.message ?? null }
  }

  async function signOut() {
    // Drafts can hold private dreams; don't leave them behind on a possibly shared browser.
    clearAllDrafts()
    await supabase.auth.signOut()
  }

  async function requestPasswordReset(email: string) {
    if (!isSupabaseConfigured) return { error: NOT_CONFIGURED_ERROR }

    // The email link signs the user in with a recovery session and lands on this page, which
    // asks for the new password. BASE_URL keeps it working under the GitHub Pages subpath.
    const redirectTo = `${window.location.origin}${import.meta.env.BASE_URL}reset-password`
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo })
    return { error: error?.message ?? null }
  }

  async function updatePassword(password: string) {
    if (!isSupabaseConfigured) return { error: NOT_CONFIGURED_ERROR }

    const { error } = await supabase.auth.updateUser({ password })
    return { error: error?.message ?? null }
  }

  return (
    <AuthContext.Provider
      value={{
        user: session?.user ?? null,
        session,
        loading,
        signUp,
        signIn,
        signOut,
        requestPasswordReset,
        updatePassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider')
  return ctx
}
