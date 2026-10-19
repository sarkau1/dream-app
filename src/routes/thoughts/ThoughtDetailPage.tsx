import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import DreamCardSkeleton from '../../components/DreamCardSkeleton'
import { FormError } from '../../components/TextField'
import ThoughtForm from '../../components/ThoughtForm'
import { useAuth } from '../../context/useAuth'
import { formatDreamDate } from '../../lib/dates'
import { thoughtDraftKey } from '../../lib/drafts'
import { deleteThought, fetchThought, updateThought } from '../../lib/thoughtsApi'
import { useDocumentTitle } from '../../lib/useDocumentTitle'
import type { Thought } from '../../types/thought'
import { KIND_COLORS } from './kindColors'

// The diary lives in a tab on the Dusk (habits) page.
const DIARY = '/habits?tab=diary'

export default function ThoughtDetailPage() {
  const { id } = useParams<{ id: string }>()
  const userId = useAuth().user?.id ?? null
  const navigate = useNavigate()
  const [thought, setThought] = useState<Thought | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editing, setEditing] = useState(false)
  const [deleting, setDeleting] = useState(false)
  useDocumentTitle(thought?.title ?? 'Thought')

  useEffect(() => {
    if (!id) return
    let cancelled = false
    void fetchThought(id).then(({ thought, error }) => {
      if (cancelled) return
      setThought(thought)
      setError(error)
      setLoading(false)
    })
    return () => {
      cancelled = true
    }
  }, [id])

  async function reload() {
    if (!id) return
    const result = await fetchThought(id)
    setThought(result.thought)
  }

  async function handleDelete() {
    if (!id) return
    if (!window.confirm('Delete this thought? This cannot be undone.')) return
    setDeleting(true)
    const { error } = await deleteThought(id)
    setDeleting(false)
    if (error) {
      setError(error)
      return
    }
    navigate(DIARY)
  }

  if (loading) return <DreamCardSkeleton count={1} label="Loading..." />

  if (!thought) {
    return (
      <div className="space-y-4">
        {error ? <FormError message={error} /> : <p className="text-moon-300">Thought not found.</p>}
        <Link to={DIARY} className="text-nebula-300 hover:underline">
          Back to the diary
        </Link>
      </div>
    )
  }

  const kind = thought.kind ? KIND_COLORS[thought.kind] : null

  return (
    <div className="max-w-2xl space-y-6">
      <Link to={DIARY} className="text-sm text-moon-500 hover:text-nebula-300">
        &larr; Back to the diary
      </Link>

      {editing ? (
        <ThoughtForm
          initialValues={thought}
          draftKey={userId ? thoughtDraftKey(userId, thought.id) : undefined}
          editsSavedThought
          submitLabel="Save changes"
          submittingLabel="Saving..."
          onSubmit={(values) => updateThought(thought.id, values)}
          onSuccess={() => {
            setEditing(false)
            void reload()
          }}
          onCancel={() => setEditing(false)}
        />
      ) : (
        <article className="rounded-xl border border-midnight-700 bg-midnight-900/60 p-6">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className={`text-[11px] font-medium tracking-[0.2em] uppercase ${kind?.text ?? 'text-moon-500'}`}>
                {thought.kind ?? 'Note'} · {formatDreamDate(thought.writtenOn)}
              </p>
              <h1 className="mt-2 text-2xl font-semibold break-words text-moon-100">{thought.title}</h1>
            </div>
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
          </div>

          {thought.tags.length > 0 && (
            <ul className="mt-3 flex flex-wrap gap-x-3 gap-y-1" aria-label="Tags">
              {thought.tags.map((tag) => (
                <li key={tag} className="text-sm text-moon-400 before:mr-1 before:text-nebula-400/70 before:content-['#']">
                  {tag}
                </li>
              ))}
            </ul>
          )}

          <p className="mt-4 whitespace-pre-wrap break-words text-moon-300">{thought.body}</p>
          <div className="mt-3">
            <FormError message={error} />
          </div>
        </article>
      )}
    </div>
  )
}
