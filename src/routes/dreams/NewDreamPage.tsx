import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useDreamPosts } from '../../context/DreamPostContext'

export default function NewDreamPage() {
  const { createDream } = useDreamPosts()
  const navigate = useNavigate()

  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!title.trim() || !body.trim()) return

    setSubmitting(true)
    setError(null)
    const { error } = await createDream(title.trim(), body.trim())
    setSubmitting(false)

    if (error) {
      setError(error)
      return
    }
    navigate('/dreams')
  }

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <Link to="/dreams" className="text-sm text-moon-500 hover:text-nebula-300">
          &larr; Back to Dream Feed
        </Link>
        <h1 className="mt-2 text-3xl font-semibold text-moon-100">Post a dream</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-moon-300">Title</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-1 w-full rounded-lg border border-midnight-700 bg-midnight-900/60 px-3 py-2 text-moon-100 placeholder:text-moon-500 focus:border-nebula-400 focus:outline-none"
            placeholder="Give your dream a title"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-moon-300">What happened?</label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={8}
            className="mt-1 w-full rounded-lg border border-midnight-700 bg-midnight-900/60 px-3 py-2 text-moon-100 placeholder:text-moon-500 focus:border-nebula-400 focus:outline-none"
            placeholder="Describe your dream..."
          />
        </div>

        {error && <p className="text-sm text-rose-400">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="rounded-full bg-nebula-500 px-5 py-2 text-sm font-medium text-white hover:bg-nebula-400 disabled:opacity-50"
        >
          {submitting ? 'Posting...' : 'Post dream'}
        </button>
      </form>
    </div>
  )
}
