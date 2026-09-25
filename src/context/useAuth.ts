import { createContext, useContext } from 'react'
import type { Session, User } from '@supabase/auth-js'

// Lives apart from AuthProvider so that file only exports a component (keeps fast refresh working).
/** The signed-in user's public profile row (see supabase/schema.sql). */
export interface Profile {
  displayName: string
  createdAt: string
}

export interface AuthContextValue {
  user: User | null
  session: Session | null
  loading: boolean
  /** null until loaded, and while signed out */
  profile: Profile | null
  signUp: (email: string, password: string, displayName: string) => Promise<{ error: string | null; needsEmailConfirmation: boolean }>
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
  requestPasswordReset: (email: string) => Promise<{ error: string | null }>
  updatePassword: (password: string) => Promise<{ error: string | null }>
  updateDisplayName: (displayName: string) => Promise<{ error: string | null }>
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider')
  return ctx
}
