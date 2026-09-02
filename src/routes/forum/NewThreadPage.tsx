import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForum } from '../../context/ForumContext'
import { FORUM_CATEGORIES, type ForumCategory } from '../../types/forum'

export default function NewThreadPage() {
  const { displayName, setDisplayName, createThread } = useForum()
  const navigate = useNavigate()

  const [name, setName] = useState('')
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState<ForumCategory>('General')
  const [body, setBody] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const needsName = !displayName

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!title.trim() || !body.trim()) return
    if (needsName && !name.trim()) return

    setSubmitting(true)
    if (needsName) setDisplayName(name)
    const thread = await createThread(title.trim(), category, body.trim())
    setSubmitting(false)
    navigate(`/forum/${thread.id}`)
  }

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <Link to="/forum" className="text-sm text-moon-500 hover:text-nebula-300">
          &larr; Back to Forum
        </Link>
        <h1 className="mt-2 text-3xl font-semibold text-moon-100">New thread</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {needsName && (
          <div>
            <label className="block text-sm font-medium text-moon-300">Your display name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="How should others see you?"
              className="mt-1 w-full rounded-lg border border-midnight-700 bg-midnight-900/60 px-3 py-2 text-moon-100 placeholder:text-moon-500 focus:border-nebula-400 focus:outline-none"
            />
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-moon-300">Title</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-1 w-full rounded-lg border border-midnight-700 bg-midnight-900/60 px-3 py-2 text-moon-100 placeholder:text-moon-500 focus:border-nebula-400 focus:outline-none"
            placeholder="What do you want to discuss?"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-moon-300">Category</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as ForumCategory)}
            className="mt-1 w-full rounded-lg border border-midnight-700 bg-midnight-900/60 px-3 py-2 text-moon-100 focus:border-nebula-400 focus:outline-none"
          >
            {FORUM_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-moon-300">Post</label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={6}
            className="mt-1 w-full rounded-lg border border-midnight-700 bg-midnight-900/60 px-3 py-2 text-moon-100 placeholder:text-moon-500 focus:border-nebula-400 focus:outline-none"
            placeholder="Share your technique, question, or dream report..."
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="rounded-full bg-nebula-500 px-5 py-2 text-sm font-medium text-white hover:bg-nebula-400 disabled:opacity-50"
        >
          {submitting ? 'Posting...' : 'Post thread'}
        </button>
      </form>
    </div>
  )
}
