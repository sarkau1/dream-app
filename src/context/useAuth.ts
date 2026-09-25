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
  /** Why the profile couldn't be loaded, if it couldn't; reloadProfile tries again. */
  profileError: string | null
  reloadProfile: () => Promise<void>
  signUp: (email: string, password: string, displayName: string) => Promise<{ error: string | null; needsEmailConfirmation: boolean }>
  signIn: (email: string, password: string) => Promise<Result>
  signOut: () => Promise<void>
  requestPasswordReset: (email: string) => Promise<Result>
  /** Sets a new password without the old one; only for the reset-link flow. */
  updatePassword: (password: string) => Promise<Result>
  /** Sets a new password after checking the current one. */
  changePassword: (currentPassword: string, newPassword: string) => Promise<Result>
  /** Starts an email change; it takes effect once the confirmation link is followed. */
  changeEmail: (email: string) => Promise<Result>
  updateDisplayName: (displayName: string) => Promise<Result>
  /** Permanently deletes the account, its profile and every dream, then signs out. */
  deleteAccount: () => Promise<Result>
}

type Result = { error: string | null }

export const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider')
  return ctx
}
