import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import DreamForm from '../../components/DreamForm'
import { useAuth } from '../../context/useAuth'
import { useDreamPosts } from '../../context/useDreamPosts'
import AuthorByline from '../../components/AuthorByline'
import DreamDiscussion from '../../components/DreamDiscussion'
import DreamImage from '../../components/DreamImage'
import DreamNote from '../../components/DreamNote'
import DreamTags from '../../components/DreamTags'
import { draftKey } from '../../lib/drafts'
import type { DreamPost } from '../../types/dream'
import { useDocumentTitle } from '../../lib/useDocumentTitle'
import DreamCardSkeleton from '../../components/DreamCardSkeleton'
import { FormError } from '../../components/TextField'
import ReportButton from '../../components/ReportButton'
import { hideDream, unhideDream } from '../../lib/moderation'
import { useSubmit } from '../../lib/useSubmit'

/** Hide or unhide someone else's shared dream; admins only (the database checks too). */
function AdminDreamControls({ dream, onChanged }: { dream: DreamPost; onChanged: () => void }) {
  const { pending, error, run } = useSubmit()

  async function toggle() {
    if (dream.hiddenAt) {
      if (await run(() => unhideDream(dream.id))) onChanged()
      return
    }
    const reason = window.prompt('Why hide this dream? The dreamer will see this.', 'Breaks the community rules')
    if (reason === null) return
    if (await run(() => hideDream(dream.id, reason))) onChanged()
  }

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-nebula-400/30 bg-nebula-500/5 px-4 py-3">
      <span className="text-xs font-medium uppercase tracking-wide text-nebula-300">Admin</span>
      <button
        type="button"
        onClick={toggle}
        disabled={pending}
        className="rounded-full border border-midnight-700 px-3 py-1 text-xs text-moon-300 hover:text-moon-100 disabled:opacity-50"
      >
        {pending ? '...' : dream.hiddenAt ? 'Show in feed again' : 'Hide from feed'}
      </button>
      <Link to={`/dreamers/${dream.userId}`} className="text-xs text-nebula-300 hover:text-nebula-200">
        Manage {dream.authorName}
      </Link>
      <FormError message={error} />
    </div>
  )
}

export default function DreamDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { user, profile, loading: authLoading } = useAuth()
  const { getDream, updateDream, deleteDream, refresh } = useDreamPosts()
  const navigate = useNavigate()
  const location = useLocation()

  const [dream, setDream] = useState<DreamPost | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editing, setEditing] = useState(false)
  const [deleting, setDeleting] = useState(false)
  useDocumentTitle(dream?.title ?? 'Dream')

  useEffect(() => {
    if (!id) return
    // Ignore the answer if the user has already moved on to another dream (or signed out).
    let cancelled = false
    setLoading(true)
    getDream(id).then(({ dream, error }) => {
      if (cancelled) return
      setDream(dream)
      setError(error)
      setLoading(false)
    })
    return () => {
      cancelled = true
    }
  }, [id, getDream])

  async function handleDelete() {
    if (!id) return
    if (!window.confirm('Delete this dream? This cannot be undone.')) return

    setDeleting(true)
    const { error } = await deleteDream(id)
    setDeleting(false)

    if (error) {
      setError(error)
      return
    }
    navigate('/journal')
  }

  if (loading || authLoading) {
    return <DreamCardSkeleton count={1} label="Loading dream..." />
  }

  if (!user) {
    return (
      <p className="text-moon-400">
        <Link to="/login" state={{ from: location }} className="text-nebula-300 hover:text-nebula-200">
          Log in
        </Link>{' '}
        to read this dream.
      </p>
    )
  }

  if (error && !dream) {
    return <FormError message={error} />
  }

  if (!dream) {
    return (
      <div className="space-y-4">
        <p className="text-moon-300">Dream not found.</p>
        <Link to="/dreams" className="text-nebula-300 hover:underline">
          Back to Dream Feed
        </Link>
      </div>
    )
  }

  const isOwner = user?.id === dream.userId
  const isAdmin = profile?.isAdmin === true
  const reload = () => {
    getDream(dream.id).then(({ dream }) => setDream(dream))
    // Hiding or unhiding changes what the feed shows.
    void refresh()
  }

  return (
    <div className="max-w-2xl space-y-6">
      <Link
        to={isOwner ? '/journal' : '/dreams'}
        className="text-sm text-moon-500 hover:text-nebula-300"
      >
        &larr; Back to {isOwner ? 'Dream Journal' : 'Dream Feed'}
      </Link>

      {editing ? (
        <DreamForm
          initialValues={{
            title: dream.title,
            body: dream.body,
            mood: dream.mood,
            symbols: dream.symbols,
            isPrivate: dream.isPrivate,
            dreamtOn: dream.dreamtOn,
            imagePath: dream.imagePath,
          }}
          draftKey={user ? draftKey(user.id, dream.id) : undefined}
          editsSavedDream
          submitLabel="Save changes"
          submittingLabel="Saving..."
          onSubmit={(values) => updateDream(dream.id, values)}
          onSuccess={() => {
            setEditing(false)
            getDream(dream.id).then(({ dream }) => setDream(dream))
          }}
          onCancel={() => setEditing(false)}
        />
      ) : (
        <div className="rounded-xl border border-midnight-700 bg-midnight-900/60 p-6">
          <div className="mb-4">
            <AuthorByline dream={dream} />
          </div>
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-semibold text-moon-100">{dream.title}</h1>
              {dream.isPrivate && (
                <span className="rounded-full border border-amber-400/40 bg-amber-400/10 px-2.5 py-0.5 text-xs text-amber-300">
                  Private
                </span>
              )}
            </div>
            {isOwner && (
              <div className="flex shrink-0 gap-2">
                <button
                  onClick={() => setEditing(true)}
                  className="rounded-full border border-midnight-700 px-3 py-1 text-xs text-moon-300 hover:text-moon-100"
                >
                  Edit
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="rounded-full border border-rose-500/40 px-3 py-1 text-xs text-rose-400 hover:bg-rose-500/10 disabled:opacity-50"
                >
                  {deleting ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            )}
          </div>

          <DreamTags dream={dream} large className="mt-3" />

          {dream.imagePath && <DreamImage path={dream.imagePath} title={dream.title} className="mt-4" />}

          <p className="mt-4 whitespace-pre-wrap text-moon-300">{dream.body}</p>
          <div className="mt-3">
            <FormError message={error} />
          </div>

          {!isOwner && !dream.isPrivate && (
            <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-midnight-700/60 pt-3">
              <ReportButton kind="dream" target={dream.id} />
            </div>
          )}
        </div>
      )}

      {dream.hiddenAt && (isOwner || isAdmin) && (
        <div role="note" className="rounded-xl border border-rose-400/30 bg-rose-500/5 px-4 py-3 text-sm text-rose-200">
          <p className="font-medium">Hidden from the Dream Feed by a moderator.</p>
          {dream.hiddenReason && <p className="mt-0.5 text-rose-200/80">Reason: {dream.hiddenReason}</p>}
          {isOwner && (
            <p className="mt-0.5 text-rose-200/80">It’s still in your journal; only you can see it.</p>
          )}
        </div>
      )}

      {isAdmin && !isOwner && !dream.isPrivate && (
        <AdminDreamControls dream={dream} onChanged={reload} />
      )}

      {!editing && isOwner && <DreamNote dreamId={dream.id} userId={user.id} />}
      {/* Private dreams have no audience, so nothing to react to or comment on. */}
      {!editing && !dream.isPrivate && (
        <DreamDiscussion dreamId={dream.id} dreamerId={dream.userId} userId={user.id} />
      )}
    </div>
  )
}
