import { Link, useNavigate } from 'react-router-dom'
import ThoughtForm from '../../components/ThoughtForm'
import { useAuth } from '../../context/useAuth'
import { thoughtDraftKey } from '../../lib/drafts'
import { createThought } from '../../lib/thoughtsApi'
import { useDocumentTitle } from '../../lib/useDocumentTitle'

// The diary lives in a tab on the Dusk (habits) page.
const DIARY = '/habits?tab=diary'

export default function NewThoughtPage() {
  useDocumentTitle('Write a thought')
  // ProtectedRoute guarantees a user here.
  const userId = useAuth().user?.id ?? null
  const navigate = useNavigate()

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <Link to={DIARY} className="text-sm text-moon-500 hover:text-nebula-300">
          &larr; Back to the diary
        </Link>
        <h1 className="mt-2 text-3xl font-semibold text-moon-100">Write a thought</h1>
      </div>

      <ThoughtForm
        draftKey={userId ? thoughtDraftKey(userId, null) : undefined}
        submitLabel="Save"
        submittingLabel="Saving..."
        onSubmit={async (values) =>
          userId ? createThought(userId, values) : { error: 'Log in to write.' }
        }
        onSuccess={() => navigate(DIARY)}
      />
    </div>
  )
}
