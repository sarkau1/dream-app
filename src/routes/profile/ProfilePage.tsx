import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Avatar from '../../components/Avatar'
import { useAuth } from '../../context/useAuth'
import { useDreamPosts } from '../../context/useDreamPosts'
import { todayLocal } from '../../lib/dates'
import { essenceFromDreams } from '../../lib/essence'
import { downloadFile, dreamsToJson, dreamsToMarkdown } from '../../lib/exportDreams'
import { MIN_PASSWORD_LENGTH, newPasswordProblem } from '../../lib/passwords'
import { MAX_DISPLAY_NAME_LENGTH } from '../../types/dream'
import {
  cardClass,
  dangerButtonClass,
  dangerOutlineButtonClass,
  inputClass,
  labelClass,
  primaryButtonClass,
  secondaryButtonClass,
} from '../../styles/ui'
import { useDocumentTitle } from '../../lib/useDocumentTitle'

const sectionClass = `space-y-4 p-6 ${cardClass}`

function DisplayNameForm({ current }: { current: string }) {
  const { updateDisplayName } = useAuth()
  const { refresh, refreshMyDreams } = useDreamPosts()
  const [name, setName] = useState(current)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const unchanged = name.trim() === current

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setSaved(false)
    const { error } = await updateDisplayName(name)
    setSaving(false)

    if (error) {
      setError(error)
      return
    }
    setSaved(true)
    // Author names are resolved when dreams are fetched, so reload them to show the new name.
    void refresh()
    void refreshMyDreams()
  }

  return (
    <form onSubmit={handleSubmit} className={sectionClass}>
      <div>
        <h2 className="text-lg font-medium text-moon-100">Display name</h2>
        <p className="mt-1 text-sm text-moon-400">
          Shown next to every dream you share in the Dream Feed.
        </p>
      </div>
      <div>
        <label htmlFor="profile-name" className="sr-only">
          Display name
        </label>
        <input
          id="profile-name"
          autoComplete="nickname"
          value={name}
          required
          maxLength={MAX_DISPLAY_NAME_LENGTH}
          onChange={(e) => {
            setName(e.target.value)
            setSaved(false)
          }}
          className={inputClass}
        />
      </div>
      {error && <p className="text-sm text-rose-400">{error}</p>}
      <div className="flex items-center gap-3">
        <button type="submit" disabled={saving || unchanged} className={primaryButtonClass}>
          {saving ? 'Saving...' : 'Save name'}
        </button>
        {saved && (
          <p role="status" className="text-sm text-aurora-300">
            Saved.
          </p>
        )}
      </div>
    </form>
  )
}

function EmailForm({ current }: { current: string }) {
  const { changeEmail } = useAuth()
  const [email, setEmail] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sentTo, setSentTo] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const next = email.trim()
    if (!next || next.toLowerCase() === current.toLowerCase()) {
      setError('Enter a different email address.')
      return
    }

    setSaving(true)
    setError(null)
    const { error } = await changeEmail(next)
    setSaving(false)

    if (error) {
      setError(error)
      return
    }
    setSentTo(next)
    setEmail('')
  }

  return (
    <form onSubmit={handleSubmit} className={sectionClass}>
      <div>
        <h2 className="text-lg font-medium text-moon-100">Email</h2>
        <p className="mt-1 text-sm text-moon-400">
          You log in with <strong className="text-moon-100">{current}</strong>. Only you can see it.
        </p>
      </div>
      <div>
        <label htmlFor="profile-email" className={labelClass}>
          New email
        </label>
        <input
          id="profile-email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={inputClass}
          placeholder="you@example.com"
        />
      </div>
      {error && <p className="text-sm text-rose-400">{error}</p>}
      {sentTo && (
        <p role="status" className="text-sm text-aurora-300">
          Check {sentTo} for a confirmation link. Your email changes once you follow it.
        </p>
      )}
      <button type="submit" disabled={saving || !email.trim()} className={primaryButtonClass}>
        {saving ? 'Sending...' : 'Change email'}
      </button>
    </form>
  )
}

function PasswordForm() {
  const { changePassword } = useAuth()
  const [current, setCurrent] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSaved(false)
    if (!current) {
      setError('Enter your current password.')
      return
    }
    const problem = newPasswordProblem(password, confirm)
    if (problem) {
      setError(problem)
      return
    }

    setSaving(true)
    setError(null)
    const { error } = await changePassword(current, password)
    setSaving(false)

    if (error) {
      setError(error)
      return
    }
    setCurrent('')
    setPassword('')
    setConfirm('')
    setSaved(true)
  }

  return (
    <form onSubmit={handleSubmit} className={sectionClass}>
      <h2 className="text-lg font-medium text-moon-100">Change password</h2>
      <div>
        <label htmlFor="profile-current" className={labelClass}>
          Current password
        </label>
        <input
          id="profile-current"
          type="password"
          autoComplete="current-password"
          value={current}
          onChange={(e) => setCurrent(e.target.value)}
          className={inputClass}
        />
        <p className="mt-1 text-xs text-moon-500">
          Forgot it?{' '}
          <Link to="/forgot-password" className="text-nebula-300 hover:underline">
            Get a reset link
          </Link>
        </p>
      </div>
      <div>
        <label htmlFor="profile-password" className={labelClass}>
          New password
        </label>
        <input
          id="profile-password"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={inputClass}
          placeholder={`At least ${MIN_PASSWORD_LENGTH} characters`}
        />
      </div>
      <div>
        <label htmlFor="profile-confirm" className={labelClass}>
          Confirm new password
        </label>
        <input
          id="profile-confirm"
          type="password"
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          className={inputClass}
        />
      </div>
      {error && <p className="text-sm text-rose-400">{error}</p>}
      <div className="flex items-center gap-3">
        <button type="submit" disabled={saving || !password} className={primaryButtonClass}>
          {saving ? 'Saving...' : 'Save new password'}
        </button>
        {saved && (
          <p role="status" className="text-sm text-aurora-300">
            Password changed.
          </p>
        )}
      </div>
    </form>
  )
}

function ExportSection() {
  const { exportMyDreams } = useDreamPosts()
  const [exporting, setExporting] = useState<'markdown' | 'json' | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleExport(format: 'markdown' | 'json') {
    setExporting(format)
    setError(null)
    const { dreams, error } = await exportMyDreams()
    setExporting(null)
    if (error) {
      setError(error)
      return
    }

    const today = todayLocal()
    if (format === 'markdown') {
      downloadFile(`dream-journal-${today}.md`, dreamsToMarkdown(dreams, today), 'text/markdown')
    } else {
      downloadFile(`dream-journal-${today}.json`, dreamsToJson(dreams, today), 'application/json')
    }
  }

  return (
    <section className={sectionClass}>
      <div>
        <h2 className="text-lg font-medium text-moon-100">Download your journal</h2>
        <p className="mt-1 text-sm text-moon-400">
          Every dream, private ones included, in full. Markdown reads like a diary; JSON is for
          backups or moving to another app.
        </p>
      </div>
      {error && <p className="text-sm text-rose-400">{error}</p>}
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => handleExport('markdown')}
          disabled={exporting !== null}
          className={secondaryButtonClass}
        >
          {exporting === 'markdown' ? 'Preparing...' : 'Download as Markdown'}
        </button>
        <button
          type="button"
          onClick={() => handleExport('json')}
          disabled={exporting !== null}
          className={secondaryButtonClass}
        >
          {exporting === 'json' ? 'Preparing...' : 'Download as JSON'}
        </button>
      </div>
    </section>
  )
}

// Typing this is the confirmation, so an account can't be deleted by a stray click.
const DELETE_CONFIRMATION = 'delete my account'

function DeleteAccountSection({ dreamCount }: { dreamCount: number }) {
  const { deleteAccount } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [typed, setTyped] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const confirmed = typed.trim().toLowerCase() === DELETE_CONFIRMATION

  async function handleDelete(e: FormEvent) {
    e.preventDefault()
    if (!confirmed) return

    setDeleting(true)
    setError(null)
    const { error } = await deleteAccount()
    if (error) {
      setDeleting(false)
      setError(error)
      return
    }
    navigate('/', { replace: true })
  }

  return (
    <section className="space-y-4 rounded-xl border border-rose-500/30 bg-rose-500/5 p-6">
      <div>
        <h2 className="text-lg font-medium text-rose-300">Delete account</h2>
        <p className="mt-1 text-sm text-moon-400">
          Permanently deletes your account and all {dreamCount} of your dreams, including any shared
          in the feed. This can&apos;t be undone, so download your journal first if you want to
          keep it.
        </p>
      </div>
      {open ? (
        <form onSubmit={handleDelete} className="space-y-3">
          <label htmlFor="profile-delete" className="block text-sm text-moon-300">
            Type <strong className="text-rose-300">{DELETE_CONFIRMATION}</strong> to confirm
          </label>
          <input
            id="profile-delete"
            autoComplete="off"
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            className={inputClass}
          />
          {error && <p className="text-sm text-rose-400">{error}</p>}
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={deleting || !confirmed}
              className={dangerButtonClass}
            >
              {deleting ? 'Deleting...' : 'Delete everything'}
            </button>
            <button
              type="button"
              onClick={() => {
                setOpen(false)
                setTyped('')
                setError(null)
              }}
              className={secondaryButtonClass}
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className={dangerOutlineButtonClass}
        >
          Delete my account...
        </button>
      )}
    </section>
  )
}

export default function ProfilePage() {
  useDocumentTitle('Profile')
  // ProtectedRoute guarantees a user here.
  const { user, profile, profileError, reloadProfile } = useAuth()
  const { myDreams, loadingMyDreams } = useDreamPosts()
  const [retrying, setRetrying] = useState(false)
  if (!user) return null

  const name = profile?.displayName ?? 'Dreamer'
  const stillLoading = loadingMyDreams && myDreams.length === 0
  const stats = [
    { label: 'Dreams', value: myDreams.length },
    { label: 'Lucid', value: myDreams.filter((dream) => dream.mood === 'Lucid').length },
    { label: 'In feed', value: myDreams.filter((dream) => !dream.isPrivate).length },
    { label: '✦ Essence', value: essenceFromDreams(myDreams) },
  ]

  async function retry() {
    setRetrying(true)
    await reloadProfile()
    setRetrying(false)
  }

  let nameSection
  if (profile) {
    // Only mounted once the profile has loaded, so the field starts from the saved name.
    nameSection = <DisplayNameForm key={user.id} current={profile.displayName} />
  } else if (profileError) {
    nameSection = (
      <div className={sectionClass}>
        <p className="text-sm text-rose-400">Couldn&apos;t load your profile: {profileError}</p>
        <button type="button" onClick={retry} disabled={retrying} className={primaryButtonClass}>
          {retrying ? 'Trying...' : 'Try again'}
        </button>
      </div>
    )
  } else {
    nameSection = <p className="text-moon-400">Loading your profile...</p>
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-4">
        <Avatar userId={user.id} name={name} large />
        <div className="min-w-0">
          <h1 className="truncate text-3xl font-semibold text-moon-100">{name}</h1>
          {profile && (
            <p className="truncate text-sm text-moon-400">
              Dreaming since{' '}
              {new Date(profile.createdAt).toLocaleDateString(undefined, {
                month: 'long',
                year: 'numeric',
              })}
            </p>
          )}
        </div>
      </div>

      <dl className="grid grid-cols-2 gap-3 text-center sm:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-xl border border-midnight-700 bg-midnight-900/60 p-3">
            <dt className="text-xs text-moon-500">{stat.label}</dt>
            <dd className="mt-1 text-lg font-semibold text-moon-100">
              {stillLoading ? '…' : stat.value}
            </dd>
          </div>
        ))}
      </dl>
      <p className="text-sm text-moon-400">
        Your dreams live in your{' '}
        <Link to="/journal" className="text-nebula-300 hover:text-nebula-200">
          Journal
        </Link>
        .
      </p>

      {nameSection}
      {user.email && <EmailForm current={user.email} />}
      <PasswordForm />
      <ExportSection />
      <DeleteAccountSection dreamCount={myDreams.length} />
    </div>
  )
}
