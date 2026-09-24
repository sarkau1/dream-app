import { useRef } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import DreamForm from '../../components/DreamForm'
import { useAuth } from '../../context/AuthContext'
import { useDreamPosts } from '../../context/DreamPostContext'
import { draftKey } from '../../lib/drafts'
import { ESSENCE_LUCID_DREAM } from '../../lib/essence'

export default function NewDreamPage() {
  const { user } = useAuth()
  const { createDream } = useDreamPosts()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  // Writing from the Journal starts private and returns there; sharing from the Feed starts public.
  const fromJournal = searchParams.get('from') === 'journal'
  const backTo = fromJournal ? '/journal' : '/dreams'
  const saved = useRef({ isPrivate: fromJournal, essenceEarned: 0 })

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <Link to={backTo} className="text-sm text-moon-500 hover:text-nebula-300">
          &larr; Back to {fromJournal ? 'Dream Journal' : 'Dream Feed'}
        </Link>
        <h1 className="mt-2 text-3xl font-semibold text-moon-100">
          {fromJournal ? 'Write a dream' : 'Share a dream'}
        </h1>
        <p className="mt-1 text-sm text-moon-400">
          Mark a dream as <span className="text-nebula-200">Lucid</span> to earn{' '}
          <span className="text-aurora-300">✦{ESSENCE_LUCID_DREAM} Dream Essence</span>.
        </p>
      </div>

      <DreamForm
        initialValues={{ isPrivate: fromJournal }}
        // ProtectedRoute guarantees a user here.
        draftKey={user ? draftKey(user.id, null) : undefined}
        submitLabel="Save dream"
        submittingLabel="Saving..."
        onSubmit={async (values) => {
          const result = await createDream(values)
          if (!result.error) {
            // The total itself is derived from saved dreams (see lib/essence); this only drives
            // the "+N" notice on the page we land on.
            const essenceEarned = values.mood === 'Lucid' ? ESSENCE_LUCID_DREAM : 0
            saved.current = { isPrivate: values.isPrivate, essenceEarned }
          }
          return result
        }}
        // A private dream would be invisible in the Feed, so land in the Journal instead.
        onSuccess={() =>
          navigate(saved.current.isPrivate ? '/journal' : backTo, {
            state: { essenceEarned: saved.current.essenceEarned },
          })
        }
      />
    </div>
  )
}
