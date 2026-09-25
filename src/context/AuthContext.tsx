import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import type { Session, User } from '@supabase/auth-js'
import { clearAllDrafts } from '../lib/drafts'
import { friendlyError } from '../lib/errors'
import { isSupabaseConfigured, NOT_CONFIGURED_ERROR, supabase } from '../lib/supabaseClient'
import { MAX_DISPLAY_NAME_LENGTH } from '../types/dream'
import { AuthContext, type AuthContextValue, type Profile } from './useAuth'

// Makes sure the user has a profile row, which is where the Dream Feed gets author names from.
// Creates it if missing and never overwrites an existing one.
async function ensureProfile(user: User) {
  // Deliberately no fallback to the email address: display names are visible to every user.
  const displayName =
    (user.user_metadata?.display_name as string | undefined)?.trim().slice(0, MAX_DISPLAY_NAME_LENGTH) ||
    'Dreamer'
  const { error } = await supabase
    .from('profiles')
    .upsert({ user_id: user.id, display_name: displayName }, { onConflict: 'user_id', ignoreDuplicates: true })
  return error ? friendlyError(error.message) : null
}

async function fetchProfile(userId: string): Promise<{ profile: Profile | null; error: string | null }> {
  const { data, error } = await supabase
    .from('profiles')
    .select('display_name, created_at')
    .eq('user_id', userId)
    .maybeSingle()
  if (error) return { profile: null, error: friendlyError(error.message) }
  if (!data) return { profile: null, error: 'Your profile could not be found.' }
  return { profile: { displayName: data.display_name, createdAt: data.created_at }, error: null }
}

/** Where auth emails (reset, email change) send the user back to, under the GitHub Pages subpath. */
function appUrl(path: string) {
  return `${window.location.origin}${import.meta.env.BASE_URL}${path}`
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  // Without Supabase there is no session to wait for.
  const [loading, setLoading] = useState(isSupabaseConfigured)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [profileError, setProfileError] = useState<string | null>(null)
  // Whose profile we're loading, so a slow response for a previous user is ignored.
  const profileUserRef = useRef<string | null>(null)
  const user = session?.user ?? null
  const userRef = useRef(user)
  useEffect(() => {
    userRef.current = user
  })

  const loadProfile = useCallback(async (forUser: User) => {
    profileUserRef.current = forUser.id
    setProfileError(null)
    const ensureError = await ensureProfile(forUser)
    const { profile: loaded, error } = await fetchProfile(forUser.id)
    if (profileUserRef.current !== forUser.id) return
    setProfile(loaded)
    setProfileError(loaded ? null : (error ?? ensureError))
  }, [])

  useEffect(() => {
    if (!isSupabaseConfigured) return

    // Fires INITIAL_SESSION straight away with the restored session (or null), so there's no
    // separate getSession() call to race against.
    const { data: listener } = supabase.auth.onAuthStateChange((event, newSession) => {
      setSession(newSession)
      setLoading(false)
      const newUser = newSession?.user ?? null
      if (!newUser) {
        profileUserRef.current = null
        setProfile(null)
        setProfileError(null)
        return
      }
      // INITIAL_SESSION covers users whose session was restored from a previous visit, who never
      // go through SIGNED_IN and could otherwise be left without a profile (shown as "Dreamer").
      if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') void loadProfile(newUser)
    })

    return () => listener.subscription.unsubscribe()
  }, [loadProfile])

  const reloadProfile = useCallback(async () => {
    if (userRef.current) await loadProfile(userRef.current)
  }, [loadProfile])

  const signUp = useCallback(async (email: string, password: string, displayName: string) => {
    if (!isSupabaseConfigured) return { error: NOT_CONFIGURED_ERROR, needsEmailConfirmation: false }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { display_name: displayName } },
    })
    if (error) return { error: friendlyError(error.message), needsEmailConfirmation: false }
    return { error: null, needsEmailConfirmation: Boolean(data.user && !data.session) }
  }, [])

  const signIn = useCallback(async (email: string, password: string) => {
    if (!isSupabaseConfigured) return { error: NOT_CONFIGURED_ERROR }

    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error: error ? friendlyError(error.message) : null }
  }, [])

  const signOut = useCallback(async () => {
    // Drafts can hold private dreams; don't leave them behind on a possibly shared browser.
    clearAllDrafts()
    await supabase.auth.signOut()
  }, [])

  const requestPasswordReset = useCallback(async (email: string) => {
    if (!isSupabaseConfigured) return { error: NOT_CONFIGURED_ERROR }

    // The email link signs the user in with a recovery session and lands on this page, which
    // asks for the new password.
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: appUrl('reset-password'),
    })
    return { error: error ? friendlyError(error.message) : null }
  }, [])

  const updatePassword = useCallback(async (password: string) => {
    if (!isSupabaseConfigured) return { error: NOT_CONFIGURED_ERROR }

    const { error } = await supabase.auth.updateUser({ password })
    return { error: error ? friendlyError(error.message) : null }
  }, [])

  // For a signed-in user (not the reset link): proving the current password first means someone
  // who finds the account open on a shared computer can't lock its owner out.
  const changePassword = useCallback(
    async (currentPassword: string, newPassword: string) => {
      if (!isSupabaseConfigured) return { error: NOT_CONFIGURED_ERROR }
      const email = userRef.current?.email
      if (!email) return { error: 'You must be logged in to change your password.' }

      const { error: checkError } = await supabase.auth.signInWithPassword({
        email,
        password: currentPassword,
      })
      if (checkError) {
        return {
          error: /invalid login credentials/i.test(checkError.message)
            ? 'Your current password is wrong.'
            : friendlyError(checkError.message),
        }
      }
      return updatePassword(newPassword)
    },
    [updatePassword],
  )

  const changeEmail = useCallback(async (email: string) => {
    if (!isSupabaseConfigured) return { error: NOT_CONFIGURED_ERROR }
    if (!userRef.current) return { error: 'You must be logged in to change your email.' }

    // Supabase emails a confirmation link; the address only changes once it's followed.
    const { error } = await supabase.auth.updateUser(
      { email },
      { emailRedirectTo: appUrl('profile') },
    )
    return { error: error ? friendlyError(error.message) : null }
  }, [])

  const updateDisplayName = useCallback(async (displayName: string) => {
    if (!isSupabaseConfigured) return { error: NOT_CONFIGURED_ERROR }
    const userId = userRef.current?.id
    if (!userId) return { error: 'You must be logged in to change your name.' }

    const name = displayName.trim()
    if (!name) return { error: 'Your display name can’t be empty.' }
    if (name.length > MAX_DISPLAY_NAME_LENGTH) {
      return { error: `Keep it to ${MAX_DISPLAY_NAME_LENGTH} characters or fewer.` }
    }

    const { data, error } = await supabase
      .from('profiles')
      .update({ display_name: name })
      .eq('user_id', userId)
      .select('display_name, created_at')
      .maybeSingle()
    if (error) return { error: friendlyError(error.message) }
    if (!data) return { error: 'Your profile could not be found. Try logging out and back in.' }

    setProfile({ displayName: data.display_name, createdAt: data.created_at })
    return { error: null }
  }, [])

  // Deletes the auth user through delete_own_account() in schema.sql; the profile and every dream
  // go with it. Signs out locally afterwards since the session no longer belongs to anyone.
  const deleteAccount = useCallback(async () => {
    if (!isSupabaseConfigured) return { error: NOT_CONFIGURED_ERROR }
    if (!userRef.current) return { error: 'You must be logged in to delete your account.' }

    const { error } = await supabase.rpc('delete_own_account')
    if (error) return { error: friendlyError(error.message) }

    clearAllDrafts()
    await supabase.auth.signOut({ scope: 'local' })
    return { error: null }
  }, [])

  // Memoized so consumers only re-render when something they can see actually changed.
  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      profile,
      profileError,
      reloadProfile,
      signUp,
      signIn,
      signOut,
      requestPasswordReset,
      updatePassword,
      changePassword,
      changeEmail,
      updateDisplayName,
      deleteAccount,
    }),
    [
      user,
      loading,
      profile,
      profileError,
      reloadProfile,
      signUp,
      signIn,
      signOut,
      requestPasswordReset,
      updatePassword,
      changePassword,
      changeEmail,
      updateDisplayName,
      deleteAccount,
    ],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
