import { useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate, type Location } from 'react-router-dom'
import TextField, { FormError } from '../../components/TextField'
import { useAuth } from '../../context/useAuth'
import { useDocumentTitle } from '../../lib/useDocumentTitle'
import { useSubmit } from '../../lib/useSubmit'
import { primaryButtonClass } from '../../styles/ui'

export default function LoginPage() {
  useDocumentTitle('Log in')
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  // Set by ProtectedRoute when it bounced the user here, so we can send them back afterwards.
  const from = (location.state as { from?: Location } | null)?.from

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const submit = useSubmit()

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!email.trim() || !password) return
    if (await submit.run(() => signIn(email.trim(), password))) {
      navigate(from ? `${from.pathname}${from.search}` : '/dreams', { replace: true })
    }
  }

  return (
    <div className="max-w-md space-y-6">
      <h1 className="text-3xl font-semibold text-moon-100">Log in</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <TextField
          id="login-email"
          label="Email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={setEmail}
          placeholder="you@example.com"
        />
        <TextField
          id="login-password"
          label="Password"
          labelAside={
            <Link to="/forgot-password" className="text-xs text-nebula-300 hover:underline">
              Forgot password?
            </Link>
          }
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={setPassword}
          placeholder="Your password"
        />

        <FormError message={submit.error} />

        <button type="submit" disabled={submit.pending} className={primaryButtonClass}>
          {submit.pending ? 'Logging in...' : 'Log in'}
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
