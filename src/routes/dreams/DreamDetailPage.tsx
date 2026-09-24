import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import DreamForm from '../../components/DreamForm'
import { useAuth } from '../../context/AuthContext'
import { useDreamPosts } from '../../context/DreamPostContext'
import type { DreamPost } from '../../types/dream'

export default function DreamDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const { getDream, updateDream, deleteDream } = useDreamPosts()
  const navigate = useNavigate()

  const [dream, setDream] = useState<DreamPost | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editing, setEditing] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (!id) return
    setLoading(true)
    getDream(id).then(({ dream, error }) => {
      setDream(dream)
      setError(error)
      setLoading(false)
    })
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

  if (loading) {
    return <p className="text-moon-400">Loading dream...</p>
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
          }}
          submitLabel="Save changes"
          submittingLabel="Saving..."
          onSubmit={({ title, body, mood, symbols, isPrivate }) =>
            updateDream(dream.id, title, body, mood, symbols, isPrivate)
          }
          onSuccess={() => {
            setEditing(false)
            getDream(dream.id).then(({ dream }) => setDream(dream))
          }}
          onCancel={() => setEditing(false)}
        />
      ) : (
        <div className="rounded-xl border border-midnight-700 bg-midnight-900/60 p-6">
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

          {(dream.mood || dream.symbols.length > 0) && (
            <div className="mt-3 flex flex-wrap gap-2">
              {dream.mood && (
                <span className="rounded-full border border-nebula-400 bg-nebula-500/20 px-3 py-1 text-xs text-nebula-200">
                  {dream.mood}
                </span>
              )}
              {dream.symbols.map((symbol) => (
                <span
                  key={symbol}
                  className="rounded-full border border-midnight-700 px-3 py-1 text-xs text-moon-400"
                >
                  {symbol}
                </span>
              ))}
            </div>
          )}

          <p className="mt-4 whitespace-pre-wrap text-moon-300">{dream.body}</p>
          <p className="mt-4 text-xs text-moon-500">
            {dream.authorName} &middot; {new Date(dream.createdAt).toLocaleString()}
          </p>
          {error && <p className="mt-3 text-sm text-rose-400">{error}</p>}
        </div>
      )}
    </div>
  )
}
