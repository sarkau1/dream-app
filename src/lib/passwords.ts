// Supabase's default minimum; raise both together if the project setting changes.
export const MIN_PASSWORD_LENGTH = 6

/** What's wrong with a new password and its confirmation, or null if it can be saved. */
export function newPasswordProblem(password: string, confirm: string): string | null {
  if (password.length < MIN_PASSWORD_LENGTH) return `Use at least ${MIN_PASSWORD_LENGTH} characters.`
  if (password !== confirm) return "The passwords don't match."
  return null
}
