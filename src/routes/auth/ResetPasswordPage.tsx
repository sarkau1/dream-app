import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/useAuth'
import { MIN_PASSWORD_LENGTH, newPasswordProblem } from '../../lib/passwords'

/**
 * Landing page for the password-reset email. Supabase reads the token from the link and signs
 * the user in with a recovery session, so a signed-in user here is allowed to set a new password.
 * No session means the link was invalid or expired.
 */
export default function ResetPasswordPage() {
  const { user, loading, updatePassword } = useAuth()
  const navigate = useNavigate()

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const problem = newPasswordProblem(password, confirm)
    if (problem) {
      setError(problem)
      return
    }

    setSubmitting(true)
    setError(null)
    const { error } = await updatePassword(password)
    setSubmitting(false)

    if (error) {
      setError(error)
      return
    }
    navigate('/journal', { replace: true })
  }

  if (loading) return <p className="text-moon-400">Loading...</p>

  if (!user) {
    return (
      <div className="max-w-md space-y-4">
        <h1 className="text-3xl font-semibold text-moon-100">Link expired</h1>
        <p className="text-moon-300">
          This password reset link is invalid or has expired. Reset links only work once.
        </p>
        <Link to="/forgot-password" className="text-nebula-300 hover:underline">
          Send a new link
        </Link>
      </div>
    )
  }

  const inputClass =
    'mt-1 w-full rounded-lg border border-midnight-700 bg-midnight-900/60 px-3 py-2 text-moon-100 placeholder:text-moon-500 focus:border-nebula-400 focus:outline-none'

  return (
    <div className="max-w-md space-y-6">
      <h1 className="text-3xl font-semibold text-moon-100">Choose a new password</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="reset-password" className="block text-sm font-medium text-moon-300">
            New password
          </label>
          <input
            id="reset-password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={inputClass}
            placeholder={`At least ${MIN_PASSWORD_LENGTH} characters`}
          />
        </div>

        <div>
          <label htmlFor="reset-confirm" className="block text-sm font-medium text-moon-300">
            Confirm new password
          </label>
          <input
            id="reset-confirm"
            type="password"
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className={inputClass}
          />
        </div>

        {error && <p className="text-sm text-rose-400">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="rounded-full bg-nebula-500 px-5 py-2 text-sm font-medium text-white hover:bg-nebula-400 disabled:opacity-50"
        >
          {submitting ? 'Saving...' : 'Save new password'}
        </button>
      </form>
    </div>
  )
}
