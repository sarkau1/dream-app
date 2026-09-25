import { useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate, type Location } from 'react-router-dom'
import { useAuth } from '../../context/useAuth'

export default function LoginPage() {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  // Set by ProtectedRoute when it bounced the user here, so we can send them back afterwards.
  const from = (location.state as { from?: Location } | null)?.from

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!email.trim() || !password) return

    setSubmitting(true)
    setError(null)
    const { error } = await signIn(email.trim(), password)
    setSubmitting(false)

    if (error) {
      setError(error)
      return
    }
    navigate(from ? `${from.pathname}${from.search}` : '/dreams', { replace: true })
  }

  return (
    <div className="max-w-md space-y-6">
      <h1 className="text-3xl font-semibold text-moon-100">Log in</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="login-email" className="block text-sm font-medium text-moon-300">
            Email
          </label>
          <input
            id="login-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-lg border border-midnight-700 bg-midnight-900/60 px-3 py-2 text-moon-100 placeholder:text-moon-500 focus:border-nebula-400 focus:outline-none"
            placeholder="you@example.com"
          />
        </div>

        <div>
          <div className="flex items-baseline justify-between">
            <label htmlFor="login-password" className="block text-sm font-medium text-moon-300">
              Password
            </label>
            <Link to="/forgot-password" className="text-xs text-nebula-300 hover:underline">
              Forgot password?
            </Link>
          </div>
          <input
            id="login-password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded-lg border border-midnight-700 bg-midnight-900/60 px-3 py-2 text-moon-100 placeholder:text-moon-500 focus:border-nebula-400 focus:outline-none"
            placeholder="Your password"
          />
        </div>

        {error && <p className="text-sm text-rose-400">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="rounded-full bg-nebula-500 px-5 py-2 text-sm font-medium text-white hover:bg-nebula-400 disabled:opacity-50"
        >
          {submitting ? 'Logging in...' : 'Log in'}
        </button>
      </form>

      <p className="text-sm text-moon-400">
        Need an account?{' '}
        <Link to="/register" className="text-nebula-300 hover:underline">
          Register
        </Link>
      </p>
    </div>
  )
}
