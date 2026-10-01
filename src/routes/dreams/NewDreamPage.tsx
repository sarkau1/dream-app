import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import DreamForm from '../../components/DreamForm'
import { useAuth } from '../../context/useAuth'
import { useDreamPosts } from '../../context/useDreamPosts'
import { draftKey } from '../../lib/drafts'
import { useDocumentTitle } from '../../lib/useDocumentTitle'

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
