import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import TextField, { FormError } from '../../components/TextField'
import { useAuth } from '../../context/useAuth'
import { MIN_PASSWORD_LENGTH, newPasswordProblem } from '../../lib/passwords'
import { useDocumentTitle } from '../../lib/useDocumentTitle'
import { useSubmit } from '../../lib/useSubmit'
import { primaryButtonClass } from '../../styles/ui'

/**
 * Landing page for the password-reset email. Supabase reads the token from the link and signs
 * the user in with a recovery session, so a signed-in user here is allowed to set a new password.
 * No session means the link was invalid or expired.
 */
export default function ResetPasswordPage() {
  useDocumentTitle('Choose a new password')
  const { user, loading, updatePassword } = useAuth()
  const navigate = useNavigate()

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const submit = useSubmit()

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const problem = newPasswordProblem(password, confirm)
    if (problem) {
      submit.fail(problem)
      return
    }
    if (await submit.run(() => updatePassword(password))) navigate('/journal', { replace: true })
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

  return (
    <div className="max-w-md space-y-6">
      <h1 className="text-3xl font-semibold text-moon-100">Choose a new password</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <TextField
          id="reset-password"
          label="New password"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={setPassword}
          placeholder={`At least ${MIN_PASSWORD_LENGTH} characters`}
        />
        <TextField
          id="reset-confirm"
          label="Confirm new password"
          type="password"
          autoComplete="new-password"
          value={confirm}
          onChange={setConfirm}
        />

        <FormError message={submit.error} />

        <button type="submit" disabled={submit.pending} className={primaryButtonClass}>
          {submit.pending ? 'Saving...' : 'Save new password'}
        </button>
      </form>
    </div>
  )
}
