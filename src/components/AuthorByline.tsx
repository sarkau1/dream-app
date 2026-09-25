import { useAuth } from '../context/useAuth'
import { formatDreamDate } from '../lib/dates'
import Avatar from './Avatar'
import type { DreamPost } from '../types/dream'

export default function AuthorByline({ dream }: { dream: DreamPost }) {
  const { user } = useAuth()
  const isMine = user?.id === dream.userId

  return (
    <div className="flex items-center gap-3">
      <Avatar userId={dream.userId} name={dream.authorName} />
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
