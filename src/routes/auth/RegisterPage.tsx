import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import TextField, { FormError } from '../../components/TextField'
import { useAuth } from '../../context/useAuth'
import { MIN_PASSWORD_LENGTH } from '../../lib/passwords'
import { useDocumentTitle } from '../../lib/useDocumentTitle'
import { useSubmit } from '../../lib/useSubmit'
import { primaryButtonClass } from '../../styles/ui'
import { MAX_DISPLAY_NAME_LENGTH } from '../../types/dream'

export default function RegisterPage() {
  useDocumentTitle('Create an account')
  const { signUp } = useAuth()
  const navigate = useNavigate()

  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmEmailSent, setConfirmEmailSent] = useState(false)
  const submit = useSubmit()

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!displayName.trim() || !email.trim() || !password) return

    let needsConfirmation = false
    const ok = await submit.run(async () => {
      const result = await signUp(email.trim(), password, displayName.trim())
      needsConfirmation = result.needsEmailConfirmation
      return result
    })
    if (!ok) return
    if (needsConfirmation) setConfirmEmailSent(true)
    else navigate('/dreams')
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
        <TextField
          id="register-name"
          label="Display name"
          autoComplete="nickname"
          value={displayName}
          onChange={setDisplayName}
          maxLength={MAX_DISPLAY_NAME_LENGTH}
          placeholder="How should others see you?"
        />
        <TextField
          id="register-email"
          label="Email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={setEmail}
          placeholder="you@example.com"
        />
        <TextField
          id="register-password"
          label="Password"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={setPassword}
          minLength={MIN_PASSWORD_LENGTH}
          placeholder={`At least ${MIN_PASSWORD_LENGTH} characters`}
        />

        <FormError message={submit.error} />

        <button type="submit" disabled={submit.pending} className={primaryButtonClass}>
          {submit.pending ? 'Creating account...' : 'Register'}
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
