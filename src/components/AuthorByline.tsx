import { useAuth } from '../context/useAuth'
import { formatDreamDate } from '../lib/dates'
import type { DreamPost } from '../types/dream'

// Avatar tints, picked per user so the same dreamer always gets the same colour.
const AVATAR_COLORS = [
  'bg-nebula-500/30 text-nebula-200',
  'bg-aurora-400/20 text-aurora-200',
  'bg-amber-400/20 text-amber-200',
  'bg-rose-400/20 text-rose-200',
  'bg-sky-400/20 text-sky-200',
]

function colorFor(userId: string) {
  let hash = 0
  for (const char of userId) hash = (hash * 31 + char.charCodeAt(0)) | 0
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

export default function AuthorByline({ dream }: { dream: DreamPost }) {
  const { user } = useAuth()
  const isMine = user?.id === dream.userId
  const initial = dream.authorName.trim().charAt(0).toUpperCase() || '?'

  return (
    <div className="flex items-center gap-3">
      <span
        aria-hidden="true"
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${colorFor(dream.userId)}`}
      >
        {initial}
      </span>
      <div className="min-w-0 leading-tight">
        <p className="truncate text-sm font-medium text-moon-100">
          {dream.authorName}
          {isMine && <span className="font-normal text-moon-500"> (you)</span>}
        </p>
        <p className="text-xs text-moon-500">dreamt {formatDreamDate(dream.dreamtOn)}</p>
      </div>
    </div>
  )
}
