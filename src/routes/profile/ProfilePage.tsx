import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import Avatar from '../../components/Avatar'
import { useAuth } from '../../context/useAuth'
import { useDreamPosts } from '../../context/useDreamPosts'
import { essenceFromDreams } from '../../lib/essence'
import { MIN_PASSWORD_LENGTH, newPasswordProblem } from '../../lib/passwords'
import { MAX_DISPLAY_NAME_LENGTH } from '../../types/dream'

const inputClass =
  'mt-1 w-full rounded-lg border border-midnight-700 bg-midnight-900/60 px-3 py-2 text-moon-100 placeholder:text-moon-500 focus:border-nebula-400 focus:outline-none'
const buttonClass =
  'rounded-full bg-nebula-500 px-5 py-2 text-sm font-medium text-white hover:bg-nebula-400 disabled:opacity-50'
const sectionClass = 'space-y-4 rounded-xl border border-midnight-700 bg-midnight-900/60 p-6'

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
        <button type="submit" disabled={saving || unchanged} className={buttonClass}>
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

function PasswordForm() {
  const { updatePassword } = useAuth()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSaved(false)
    const problem = newPasswordProblem(password, confirm)
    if (problem) {
      setError(problem)
      return
    }

    setSaving(true)
    setError(null)
    const { error } = await updatePassword(password)
    setSaving(false)

    if (error) {
      setError(error)
      return
    }
    setPassword('')
    setConfirm('')
    setSaved(true)
  }

  return (
    <form onSubmit={handleSubmit} className={sectionClass}>
      <h2 className="text-lg font-medium text-moon-100">Change password</h2>
      <div>
        <label htmlFor="profile-password" className="block text-sm font-medium text-moon-300">
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
        <label htmlFor="profile-confirm" className="block text-sm font-medium text-moon-300">
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
        <button type="submit" disabled={saving || !password} className={buttonClass}>
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

export default function ProfilePage() {
  // ProtectedRoute guarantees a user here.
  const { user, profile } = useAuth()
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

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-4">
        <Avatar userId={user.id} name={name} large />
        <div className="min-w-0">
          <h1 className="truncate text-3xl font-semibold text-moon-100">{name}</h1>
          <p className="truncate text-sm text-moon-400">
            {user.email}
            {profile && (
              <>
                {' '}
                &middot; dreaming since{' '}
                {new Date(profile.createdAt).toLocaleDateString(undefined, {
                  month: 'long',
                  year: 'numeric',
                })}
              </>
            )}
          </p>
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

      {/* Only mounted once the profile has loaded, so the field starts from the saved name. */}
      {profile ? (
        <DisplayNameForm key={user.id} current={profile.displayName} />
      ) : (
        <p className="text-moon-400">Loading your profile...</p>
      )}
      <PasswordForm />
    </div>
  )
}
