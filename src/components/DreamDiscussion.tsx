import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import {
  addComment,
  deleteComment,
  fetchComments,
  fetchReactions,
  MAX_COMMENT_LENGTH,
  setReaction,
  type DreamComment,
} from '../lib/dreamSocial'
import { useDreamPosts } from '../context/useDreamPosts'
import { useSubmit } from '../lib/useSubmit'
import { inputClass, primaryButtonClass } from '../styles/ui'
import Avatar from './Avatar'
import { FormError } from './TextField'

function formatCommentDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

/** Reactions and comments under a shared dream. */
export default function DreamDiscussion({
  dreamId,
  dreamerId,
  userId,
}: {
  dreamId: string
  /** The dream's author, who may remove any comment on it. */
  dreamerId: string
  userId: string
}) {
  const [reactions, setReactions] = useState({ count: 0, mine: false })
  const [comments, setComments] = useState<DreamComment[] | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [reacting, setReacting] = useState(false)
  const [body, setBody] = useState('')
  const submit = useSubmit()
  const remove = useSubmit()
  const { updateFeedCounts } = useDreamPosts()
  const commentCount = comments?.length

  // Keep the feed card in step, so going back shows the new counts without a reload.
  useEffect(() => {
    if (commentCount === undefined) return
    updateFeedCounts(dreamId, {
      commentCount,
      reactionCount: reactions.count,
      reactedByMe: reactions.mine,
    })
  }, [dreamId, commentCount, reactions, updateFeedCounts])

  const loadComments = useCallback(async () => {
    const { comments, error } = await fetchComments(dreamId)
    setComments(comments)
    setLoadError(error)
  }, [dreamId])

  useEffect(() => {
    let cancelled = false
    Promise.all([fetchReactions(dreamId, userId), fetchComments(dreamId)]).then(
      ([reactionResult, commentResult]) => {
        if (cancelled) return
        setReactions({ count: reactionResult.count, mine: reactionResult.mine })
        setComments(commentResult.comments)
        setLoadError(reactionResult.error ?? commentResult.error)
      },
    )
    return () => {
      cancelled = true
    }
  }, [dreamId, userId])

  async function toggleReaction() {
    const on = !reactions.mine
    // Flip straight away and undo if the save fails, so the button feels instant.
    setReactions((prev) => ({ count: prev.count + (on ? 1 : -1), mine: on }))
    setReacting(true)
    const { error } = await setReaction(dreamId, userId, on)
    setReacting(false)
    if (error) {
      setReactions((prev) => ({ count: prev.count + (on ? -1 : 1), mine: !on }))
      setLoadError(error)
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!body.trim()) return
    if (await submit.run(() => addComment(dreamId, userId, body))) {
      setBody('')
      await loadComments()
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm('Delete this comment?')) return
    if (await remove.run(() => deleteComment(id))) {
      setComments((prev) => prev?.filter((comment) => comment.id !== id) ?? null)
    }
  }

  return (
    <section className="space-y-4 rounded-xl border border-midnight-700 bg-midnight-900/60 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-medium text-moon-100">
          Comments{comments && comments.length > 0 ? ` (${comments.length})` : ''}
        </h2>
        <button
          type="button"
          onClick={toggleReaction}
          disabled={reacting}
          aria-pressed={reactions.mine}
          title={reactions.mine ? 'Remove your reaction' : 'Let the dreamer know this resonates'}
          className={`inline-flex min-h-11 items-center gap-2 rounded-full border px-4 text-sm transition-colors ${
            reactions.mine
              ? 'border-aurora-400/50 bg-aurora-400/10 text-aurora-200'
              : 'border-midnight-700 text-moon-300 hover:text-moon-100'
          }`}
        >
          <span aria-hidden>✦</span>
          {reactions.mine ? 'Resonates' : 'Resonates with me'}
          {reactions.count > 0 && <span className="text-moon-400">· {reactions.count}</span>}
        </button>
      </div>

      <FormError message={loadError ?? remove.error} />

      {comments === null ? (
        <p className="text-sm text-moon-500">Loading comments...</p>
      ) : comments.length === 0 ? (
        <p className="text-sm text-moon-500">No comments yet.</p>
      ) : (
        <ul className="space-y-4">
          {comments.map((comment) => (
            <li key={comment.id} className="flex gap-3">
              <Link to={`/dreamers/${comment.userId}`} tabIndex={-1} aria-hidden>
                <Avatar userId={comment.userId} name={comment.authorName} />
              </Link>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline gap-x-2 text-sm">
                  <Link
                    to={`/dreamers/${comment.userId}`}
                    className="font-medium text-moon-100 hover:text-nebula-300"
                  >
                    {comment.authorName}
                  </Link>
                  {comment.userId === dreamerId && (
                    <span className="text-xs text-nebula-300">dreamer</span>
                  )}
                  <span className="text-xs text-moon-500">{formatCommentDate(comment.createdAt)}</span>
                  {(comment.userId === userId || dreamerId === userId) && (
                    <button
                      type="button"
                      onClick={() => handleDelete(comment.id)}
                      className="ml-auto text-xs text-moon-500 hover:text-rose-300"
                    >
                      Delete
                    </button>
                  )}
                </div>
                <p className="mt-0.5 whitespace-pre-wrap break-words text-sm text-moon-300">
                  {comment.body}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={handleSubmit} className="space-y-2">
        <label htmlFor="dream-comment" className="sr-only">
          Add a comment
        </label>
        <textarea
          id="dream-comment"
          value={body}
          maxLength={MAX_COMMENT_LENGTH}
          onChange={(e) => {
            setBody(e.target.value)
            submit.reset()
          }}
          rows={2}
          placeholder="Add a comment..."
          className={inputClass}
        />
        <FormError message={submit.error} />
        <button
          type="submit"
          disabled={submit.pending || !body.trim()}
          className={primaryButtonClass}
        >
          {submit.pending ? 'Posting...' : 'Comment'}
        </button>
      </form>
    </section>
  )
}
