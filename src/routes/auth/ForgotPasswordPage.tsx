import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import TextField, { FormError } from '../../components/TextField'
import { useAuth } from '../../context/useAuth'
import { useDocumentTitle } from '../../lib/useDocumentTitle'
import { useSubmit } from '../../lib/useSubmit'
import { primaryButtonClass } from '../../styles/ui'

export default function ForgotPasswordPage() {
  useDocumentTitle('Forgot password')
  const { requestPasswordReset } = useAuth()
  const [email, setEmail] = useState('')
  const submit = useSubmit()

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!email.trim()) return
    await submit.run(() => requestPasswordReset(email.trim()))
  }

  if (submit.done) {
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
        <TextField
          id="forgot-email"
          label="Email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={setEmail}
          placeholder="you@example.com"
        />

        <FormError message={submit.error} />

        <button type="submit" disabled={submit.pending} className={primaryButtonClass}>
          {submit.pending ? 'Sending...' : 'Send reset link'}
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
