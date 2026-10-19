import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import DreamForm from '../../components/DreamForm'
import { FormError } from '../../components/TextField'
import { useAuth } from '../../context/useAuth'
import { useDreamPosts } from '../../context/useDreamPosts'
import { useBlankNights } from '../../lib/blankNights'
import { todayLocal } from '../../lib/dates'
import { draftKey } from '../../lib/drafts'
import { useDocumentTitle } from '../../lib/useDocumentTitle'

/** One tap for the mornings with nothing to write: logs last night as blank, no form needed. */
function NothingRecalled({ onLogged }: { onLogged: () => void }) {
  const { nights, setBlank } = useBlankNights()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const today = todayLocal()
  const marked = nights.has(today)

  async function toggle() {
    setSaving(true)
    setError(null)
    const result = await setBlank(today, !marked)
    setSaving(false)
    if (result.error) setError(result.error)
    else if (!marked) onLogged()
  }

  return (
    <div className="space-y-2 rounded-xl border border-midnight-700 bg-midnight-900/40 px-4 py-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-moon-300">
          {marked ? 'Last night is logged as nothing recalled.' : 'Woke up with nothing to write down?'}
        </p>
        <button
          type="button"
          onClick={() => void toggle()}
          disabled={saving}
          className="min-h-9 rounded-full border border-nebula-400/40 px-3.5 text-sm text-nebula-200 transition-colors hover:bg-nebula-500/10 disabled:opacity-60"
        >
          {saving ? 'Saving…' : marked ? 'Undo' : 'I don’t remember a dream'}
        </button>
      </div>
      <FormError message={error} />
    </div>
  )
}

export default function NewDreamPage() {
  const { user } = useAuth()
  const { createDream } = useDreamPosts()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  // Writing from the Journal starts private and returns there; sharing from the Feed starts public.
  const fromJournal = searchParams.get('from') === 'journal'
  const backTo = fromJournal ? '/journal' : '/dreams'
  useDocumentTitle(fromJournal ? 'Write a dream' : 'Share a dream')

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <Link to={backTo} className="text-sm text-moon-500 hover:text-nebula-300">
          &larr; Back to {fromJournal ? 'Dream Journal' : 'Dream Feed'}
        </Link>
        <h1 className="mt-2 text-3xl font-semibold text-moon-100">
          {fromJournal ? 'Write a dream' : 'Share a dream'}
        </h1>
      </div>

      {/* The Progress calendar is where a blank night shows up. */}
      <NothingRecalled onLogged={() => navigate('/progress')} />

      <DreamForm
        initialValues={{ isPrivate: fromJournal }}
        // ProtectedRoute guarantees a user here.
        draftKey={user ? draftKey(user.id, null) : undefined}
        submitLabel="Save dream"
        submittingLabel="Saving..."
        onSubmit={createDream}
        onSuccess={(values) =>
          // A private dream would be invisible in the Feed, so land in the Journal instead.
          navigate(values.isPrivate ? '/journal' : backTo)
        }
      />
    </div>
  )
}
