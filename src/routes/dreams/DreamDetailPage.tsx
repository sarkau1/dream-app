import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import DreamForm from '../../components/DreamForm'
import { useAuth } from '../../context/useAuth'
import { useDreamPosts } from '../../context/useDreamPosts'
import AuthorByline from '../../components/AuthorByline'
import DreamTags from '../../components/DreamTags'
import { draftKey } from '../../lib/drafts'
import type { DreamPost } from '../../types/dream'

export default function DreamDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { user, loading: authLoading } = useAuth()
  const { getDream, updateDream, deleteDream } = useDreamPosts()
  const navigate = useNavigate()
  const location = useLocation()

  const [dream, setDream] = useState<DreamPost | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editing, setEditing] = useState(false)
  const [deleting, setDeleting] = useState(false)

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
    return <p className="text-moon-400">Loading dream...</p>
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
    return <p className="text-sm text-rose-400">{error}</p>
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
          }}
          draftKey={user ? draftKey(user.id, dream.id) : undefined}
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

          <p className="mt-4 whitespace-pre-wrap text-moon-300">{dream.body}</p>
          {error && <p className="mt-3 text-sm text-rose-400">{error}</p>}
        </div>
      )}
    </div>
  )
}
