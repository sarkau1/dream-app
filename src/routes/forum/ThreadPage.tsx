import { useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useForum } from '../../context/ForumContext'

function formatDate(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export default function ThreadPage() {
  const { threadId } = useParams<{ threadId: string }>()
  const { threads, displayName, setDisplayName, addReply } = useForum()
  const thread = threads.find((t) => t.id === threadId)

  const [name, setName] = useState('')
  const [reply, setReply] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (!thread) {
    return (
      <div className="space-y-4">
        <p className="text-moon-300">Thread not found.</p>
        <Link to="/forum" className="text-nebula-300 hover:underline">
          Back to Forum
        </Link>
      </div>
    )
  }

  const needsName = !displayName

  async function handleReply(e: FormEvent) {
    e.preventDefault()
    if (!reply.trim() || !thread) return
    if (needsName && !name.trim()) return

    setSubmitting(true)
    if (needsName) setDisplayName(name)
    await addReply(thread.id, reply.trim())
    setReply('')
    setSubmitting(false)
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <Link to="/forum" className="text-sm text-moon-500 hover:text-nebula-300">
          &larr; Back to Forum
        </Link>
        <div className="mt-2 flex items-start justify-between gap-3">
          <h1 className="text-2xl font-semibold text-moon-100">{thread.title}</h1>
          <span className="shrink-0 rounded-full bg-midnight-700 px-2 py-0.5 text-xs text-moon-300">
            {thread.category}
          </span>
        </div>
      </div>

      <ul className="space-y-3">
        {thread.posts.map((post) => (
          <li key={post.id} className="rounded-2xl border border-midnight-700 bg-midnight-900/60 p-5">
            <div className="flex items-baseline justify-between gap-3">
              <span className="font-medium text-nebula-300">{post.author}</span>
              <span className="text-xs text-moon-500">{formatDate(post.createdAt)}</span>
            </div>
            <p className="mt-2 whitespace-pre-wrap text-moon-100">{post.body}</p>
          </li>
        ))}
      </ul>

      <form onSubmit={handleReply} className="space-y-3 rounded-2xl border border-midnight-700 bg-midnight-900/40 p-5">
        <h3 className="text-sm font-medium uppercase tracking-wide text-moon-300">Reply</h3>
        {needsName && (
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your display name"
            className="w-full rounded-lg border border-midnight-700 bg-midnight-900/60 px-3 py-2 text-moon-100 placeholder:text-moon-500 focus:border-nebula-400 focus:outline-none"
          />
        )}
        <textarea
          value={reply}
          onChange={(e) => setReply(e.target.value)}
          rows={3}
          placeholder="Add to the discussion..."
          className="w-full rounded-lg border border-midnight-700 bg-midnight-900/60 px-3 py-2 text-moon-100 placeholder:text-moon-500 focus:border-nebula-400 focus:outline-none"
        />
        <button
          type="submit"
          disabled={submitting}
          className="rounded-full bg-nebula-500 px-5 py-2 text-sm font-medium text-white hover:bg-nebula-400 disabled:opacity-50"
        >
          {submitting ? 'Posting...' : 'Post reply'}
        </button>
      </form>
    </div>
  )
}
