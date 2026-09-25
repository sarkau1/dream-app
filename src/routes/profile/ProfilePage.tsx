import { useState, type FormEvent, type ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Avatar from '../../components/Avatar'
import TextField, { FormError } from '../../components/TextField'
import { useAuth } from '../../context/useAuth'
import { useDreamPosts } from '../../context/useDreamPosts'
import { todayLocal } from '../../lib/dates'
import { essenceFromDreams } from '../../lib/essence'
import { downloadFile, dreamsToJson, dreamsToMarkdown } from '../../lib/exportDreams'
import { MIN_PASSWORD_LENGTH, newPasswordProblem } from '../../lib/passwords'
import { useDocumentTitle } from '../../lib/useDocumentTitle'
import { useSubmit } from '../../lib/useSubmit'
import {
  cardClass,
  dangerButtonClass,
  dangerOutlineButtonClass,
  primaryButtonClass,
  secondaryButtonClass,
} from '../../styles/ui'
import { MAX_DISPLAY_NAME_LENGTH } from '../../types/dream'

const sectionClass = `space-y-4 p-6 ${cardClass}`

function SectionHeading({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div>
      <h2 className="text-lg font-medium text-moon-100">{title}</h2>
      {children && <p className="mt-1 text-sm text-moon-400">{children}</p>}
    </div>
  )
}

function Saved({ show, children }: { show: boolean; children: ReactNode }) {
  if (!show) return null
  return (
    <p role="status" className="text-sm text-aurora-300">
      {children}
    </p>
  )
}

function DisplayNameForm({ current }: { current: string }) {
  const { updateDisplayName } = useAuth()
  const { refresh, refreshMyDreams } = useDreamPosts()
  const [name, setName] = useState(current)
  const submit = useSubmit()

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (await submit.run(() => updateDisplayName(name))) {
      // Author names are resolved when dreams are fetched, so reload them to show the new name.
      void refresh()
      void refreshMyDreams()
    }
  }

  return (
    <form onSubmit={handleSubmit} className={sectionClass}>
      <SectionHeading title="Display name">
        Shown next to every dream you share in the Dream Feed.
      </SectionHeading>
      <TextField
        id="profile-name"
        label="Display name"
        hideLabel
        autoComplete="nickname"
        value={name}
        onChange={(value) => {
          setName(value)
          submit.reset()
        }}
        required
        maxLength={MAX_DISPLAY_NAME_LENGTH}
      />
      <FormError message={submit.error} />
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={submit.pending || name.trim() === current}
          className={primaryButtonClass}
        >
          {submit.pending ? 'Saving...' : 'Save name'}
        </button>
        <Saved show={submit.done}>Saved.</Saved>
      </div>
    </form>
  )
}

function EmailForm({ current }: { current: string }) {
  const { changeEmail } = useAuth()
  const [email, setEmail] = useState('')
  const [sentTo, setSentTo] = useState('')
  const submit = useSubmit()

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const next = email.trim()
    if (!next || next.toLowerCase() === current.toLowerCase()) {
      submit.fail('Enter a different email address.')
      return
    }
    if (await submit.run(() => changeEmail(next))) {
      setSentTo(next)
      setEmail('')
    }
  }

  return (
    <form onSubmit={handleSubmit} className={sectionClass}>
      <SectionHeading title="Email">
        You log in with <strong className="text-moon-100">{current}</strong>. Only you can see it.
      </SectionHeading>
      <TextField
        id="profile-email"
        label="New email"
        type="email"
        autoComplete="email"
        value={email}
        onChange={setEmail}
        placeholder="you@example.com"
      />
      <FormError message={submit.error} />
      <Saved show={submit.done}>
        Check {sentTo} for a confirmation link. Your email changes once you follow it.
      </Saved>
      <button type="submit" disabled={submit.pending || !email.trim()} className={primaryButtonClass}>
        {submit.pending ? 'Sending...' : 'Change email'}
      </button>
    </form>
  )
}

function PasswordForm() {
  const { changePassword } = useAuth()
  const [current, setCurrent] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const submit = useSubmit()

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const problem = current ? newPasswordProblem(password, confirm) : 'Enter your current password.'
    if (problem) {
      submit.fail(problem)
      return
    }
    if (await submit.run(() => changePassword(current, password))) {
      setCurrent('')
      setPassword('')
      setConfirm('')
    }
  }

  return (
    <form onSubmit={handleSubmit} className={sectionClass}>
      <SectionHeading title="Change password" />
      <TextField
        id="profile-current"
        label="Current password"
        type="password"
        autoComplete="current-password"
        value={current}
        onChange={setCurrent}
        hint={
          <>
            Forgot it?{' '}
            <Link to="/forgot-password" className="text-nebula-300 hover:underline">
              Get a reset link
            </Link>
          </>
        }
      />
      <TextField
        id="profile-password"
        label="New password"
        type="password"
        autoComplete="new-password"
        value={password}
        onChange={setPassword}
        placeholder={`At least ${MIN_PASSWORD_LENGTH} characters`}
      />
      <TextField
        id="profile-confirm"
        label="Confirm new password"
        type="password"
        autoComplete="new-password"
        value={confirm}
        onChange={setConfirm}
      />
      <FormError message={submit.error} />
      <div className="flex items-center gap-3">
        <button type="submit" disabled={submit.pending || !password} className={primaryButtonClass}>
          {submit.pending ? 'Saving...' : 'Save new password'}
        </button>
        <Saved show={submit.done}>Password changed.</Saved>
      </div>
    </form>
  )
}

type ExportFormat = 'markdown' | 'json'

function ExportSection() {
  const { exportMyDreams } = useDreamPosts()
  const [format, setFormat] = useState<ExportFormat | null>(null)
  const submit = useSubmit()

  async function handleExport(chosen: ExportFormat) {
    setFormat(chosen)
    await submit.run(async () => {
      const { dreams, error } = await exportMyDreams()
      if (error) return { error }
      const today = todayLocal()
      if (chosen === 'markdown') {
        downloadFile(`dream-journal-${today}.md`, dreamsToMarkdown(dreams, today), 'text/markdown')
      } else {
        downloadFile(`dream-journal-${today}.json`, dreamsToJson(dreams, today), 'application/json')
      }
      return { error: null }
    })
  }

  const label = (value: ExportFormat, text: string) =>
    submit.pending && format === value ? 'Preparing...' : text

  return (
    <section className={sectionClass}>
      <SectionHeading title="Download your journal">
        Every dream, private ones included, in full. Markdown reads like a diary; JSON is for
        backups or moving to another app.
      </SectionHeading>
      <FormError message={submit.error} />
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => handleExport('markdown')}
          disabled={submit.pending}
          className={secondaryButtonClass}
        >
          {label('markdown', 'Download as Markdown')}
        </button>
        <button
          type="button"
          onClick={() => handleExport('json')}
          disabled={submit.pending}
          className={secondaryButtonClass}
        >
          {label('json', 'Download as JSON')}
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
  const submit = useSubmit()
  const confirmed = typed.trim().toLowerCase() === DELETE_CONFIRMATION

  async function handleDelete(e: FormEvent) {
    e.preventDefault()
    if (confirmed && (await submit.run(deleteAccount))) navigate('/', { replace: true })
  }

  function cancel() {
    setOpen(false)
    setTyped('')
    submit.reset()
  }

  return (
    <section className="space-y-4 rounded-2xl border border-rose-500/30 bg-rose-500/5 p-6">
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
          <TextField
            id="profile-delete"
            label={
              <>
                Type <strong className="text-rose-300">{DELETE_CONFIRMATION}</strong> to confirm
              </>
            }
            autoComplete="off"
            value={typed}
            onChange={setTyped}
          />
          <FormError message={submit.error} />
          <div className="flex flex-wrap gap-3">
            <button type="submit" disabled={submit.pending || !confirmed} className={dangerButtonClass}>
              {submit.pending ? 'Deleting...' : 'Delete everything'}
            </button>
            <button type="button" onClick={cancel} className={secondaryButtonClass}>
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <button type="button" onClick={() => setOpen(true)} className={dangerOutlineButtonClass}>
          Delete my account...
        </button>
      )}
    </section>
  )
}

function ProfileLoadError({ message }: { message: string }) {
  const { reloadProfile } = useAuth()
  const retry = useSubmit()

  // reloadProfile reports its outcome through profileError, not a return value.
  async function tryAgain() {
    await reloadProfile()
    return { error: null }
  }

  return (
    <div className={sectionClass}>
      <FormError message={`Couldn’t load your profile: ${message}`} />
      <button
        type="button"
        onClick={() => retry.run(tryAgain)}
        disabled={retry.pending}
        className={primaryButtonClass}
      >
        {retry.pending ? 'Trying...' : 'Try again'}
      </button>
    </div>
  )
}

export default function ProfilePage() {
  useDocumentTitle('Profile')
  // ProtectedRoute guarantees a user here.
  const { user, profile, profileError } = useAuth()
  const { myDreams, loadingMyDreams } = useDreamPosts()
  if (!user) return null

  const name = profile?.displayName ?? 'Dreamer'
  const stillLoading = loadingMyDreams && myDreams.length === 0
  const stats = [
    { label: 'Dreams', value: myDreams.length },
    { label: 'Lucid', value: myDreams.filter((dream) => dream.mood === 'Lucid').length },
    { label: 'In feed', value: myDreams.filter((dream) => !dream.isPrivate).length },
    { label: '✦ Essence', value: essenceFromDreams(myDreams) },
  ]

  let nameSection
  if (profile) {
    // Only mounted once the profile has loaded, so the field starts from the saved name.
    nameSection = <DisplayNameForm key={user.id} current={profile.displayName} />
  } else if (profileError) {
    nameSection = <ProfileLoadError message={profileError} />
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
          <div key={stat.label} className={`p-3 ${cardClass}`}>
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
