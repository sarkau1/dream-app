import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export default function ForgotPasswordPage() {
  const { requestPasswordReset } = useAuth()

  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!email.trim()) return

    setSubmitting(true)
    setError(null)
    const { error } = await requestPasswordReset(email.trim())
    setSubmitting(false)

    if (error) {
      setError(error)
      return
    }
    setSent(true)
  }

  if (sent) {
    return (
      <div className="max-w-md space-y-4">
        <h1 className="text-3xl font-semibold text-moon-100">Check your email</h1>
        {/* Same wording whether or not the address has an account, so this page can't be used
            to find out who is registered. */}
        <p className="text-moon-300">
          If <strong>{email}</strong> has an account, we sent it a link to choose a new password.
        </p>
        <Link to="/login" className="text-nebula-300 hover:underline">
          Back to log in
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-md space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-moon-100">Forgot your password?</h1>
        <p className="mt-2 text-sm text-moon-400">
          Enter your email and we&apos;ll send you a link to choose a new one.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="forgot-email" className="block text-sm font-medium text-moon-300">
            Email
          </label>
          <input
            id="forgot-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-lg border border-midnight-700 bg-midnight-900/60 px-3 py-2 text-moon-100 placeholder:text-moon-500 focus:border-nebula-400 focus:outline-none"
            placeholder="you@example.com"
          />
        </div>

        {error && <p className="text-sm text-rose-400">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="rounded-full bg-nebula-500 px-5 py-2 text-sm font-medium text-white hover:bg-nebula-400 disabled:opacity-50"
        >
          {submitting ? 'Sending...' : 'Send reset link'}
        </button>
      </form>

      <p className="text-sm text-moon-400">
        Remembered it?{' '}
        <Link to="/login" className="text-nebula-300 hover:underline">
          Log in
        </Link>
      </p>
    </div>
  )
}
