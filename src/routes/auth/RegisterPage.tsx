import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/useAuth'
import { MIN_PASSWORD_LENGTH } from '../../lib/passwords'
import { MAX_DISPLAY_NAME_LENGTH } from '../../types/dream'

export default function RegisterPage() {
  const { signUp } = useAuth()
  const navigate = useNavigate()

  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [confirmEmailSent, setConfirmEmailSent] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!displayName.trim() || !email.trim() || !password) return

    setSubmitting(true)
    setError(null)
    const { error, needsEmailConfirmation } = await signUp(
      email.trim(),
      password,
      displayName.trim(),
    )
    setSubmitting(false)

    if (error) {
      setError(error)
      return
    }
    if (needsEmailConfirmation) {
      setConfirmEmailSent(true)
      return
    }
    navigate('/dreams')
  }

  if (confirmEmailSent) {
    return (
      <div className="max-w-md space-y-4">
        <h1 className="text-3xl font-semibold text-moon-100">Check your email</h1>
        <p className="text-moon-300">
          We sent a confirmation link to <strong>{email}</strong>. Confirm your address, then{' '}
          <Link to="/login" className="text-nebula-300 hover:underline">
            log in
          </Link>
          .
        </p>
      </div>
    )
  }

  return (
    <div className="max-w-md space-y-6">
      <h1 className="text-3xl font-semibold text-moon-100">Create an account</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="register-name" className="block text-sm font-medium text-moon-300">
            Display name
          </label>
          <input
            id="register-name"
            autoComplete="nickname"
            value={displayName}
            maxLength={MAX_DISPLAY_NAME_LENGTH}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="How should others see you?"
            className="mt-1 w-full rounded-lg border border-midnight-700 bg-midnight-900/60 px-3 py-2 text-moon-100 placeholder:text-moon-500 focus:border-nebula-400 focus:outline-none"
          />
        </div>

        <div>
          <label htmlFor="register-email" className="block text-sm font-medium text-moon-300">
            Email
          </label>
          <input
            id="register-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-lg border border-midnight-700 bg-midnight-900/60 px-3 py-2 text-moon-100 placeholder:text-moon-500 focus:border-nebula-400 focus:outline-none"
            placeholder="you@example.com"
          />
        </div>

        <div>
          <label htmlFor="register-password" className="block text-sm font-medium text-moon-300">
            Password
          </label>
          <input
            id="register-password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={MIN_PASSWORD_LENGTH}
            className="mt-1 w-full rounded-lg border border-midnight-700 bg-midnight-900/60 px-3 py-2 text-moon-100 placeholder:text-moon-500 focus:border-nebula-400 focus:outline-none"
            placeholder="At least 6 characters"
          />
        </div>

        {error && <p className="text-sm text-rose-400">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="rounded-full bg-nebula-500 px-5 py-2 text-sm font-medium text-white hover:bg-nebula-400 disabled:opacity-50"
        >
          {submitting ? 'Creating account...' : 'Register'}
        </button>
      </form>

      <p className="text-sm text-moon-400">
        Already have an account?{' '}
        <Link to="/login" className="text-nebula-300 hover:underline">
          Log in
        </Link>
      </p>
    </div>
  )
}
