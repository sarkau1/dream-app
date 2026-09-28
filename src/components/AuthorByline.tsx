import { Link } from 'react-router-dom'
import { useAuth } from '../context/useAuth'
import { formatDreamDate } from '../lib/dates'
import Avatar from './Avatar'
import type { DreamPost } from '../types/dream'

export default function AuthorByline({
  dream,
}: {
  dream: Pick<DreamPost, 'userId' | 'authorName' | 'dreamtOn'>
}) {
  const { user } = useAuth()
  const isMine = user?.id === dream.userId

  return (
    <div className="flex items-center gap-3">
      {/* relative z-10: sits above a DreamCard's card-wide link, so it opens the dreamer. */}
      <Link
        to={`/dreamers/${dream.userId}`}
        className="group relative z-10 flex min-w-0 items-center gap-3"
      >
        <Avatar userId={dream.userId} name={dream.authorName} />
        <span className="min-w-0 leading-tight">
          <span className="block truncate text-sm font-medium text-moon-100 group-hover:text-nebula-300">
            {dream.authorName}
            {isMine && <span className="font-normal text-moon-500"> (you)</span>}
          </span>
          <span className="block text-xs text-moon-500">dreamt {formatDreamDate(dream.dreamtOn)}</span>
        </span>
      </Link>
    </div>
  )
}
