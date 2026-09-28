import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useDreamPosts } from '../context/useDreamPosts'
import { fetchLeaderboard, type LeaderboardEntry } from '../lib/leaderboard'
import Avatar from './Avatar'
import { FormError } from './TextField'

const MEDALS: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' }

function Row({ entry, isMe }: { entry: LeaderboardEntry; isMe: boolean }) {
  return (
    <li
      className={`flex items-center gap-3 rounded-xl px-2 py-1.5 ${
        isMe ? 'bg-nebula-500/15 ring-1 ring-nebula-400/30' : ''
      }`}
    >
      <span className="w-6 shrink-0 text-center text-sm text-moon-400">
        {MEDALS[entry.rank] ?? entry.rank}
      </span>
      <Link
        to={`/dreamers/${entry.userId}`}
        className="flex min-w-0 flex-1 items-center gap-2 text-sm text-moon-300 hover:text-nebula-300"
      >
        <Avatar userId={entry.userId} name={entry.displayName} />
        <span className="truncate">
          {entry.displayName}
          {isMe && <span className="text-moon-500"> (you)</span>}
        </span>
      </Link>
      <span className="shrink-0 text-sm font-medium text-moon-100">{entry.dreamCount}</span>
    </li>
  )
}

/** Dreamers ranked by dreams logged, with the signed-in user highlighted. */
export default function Leaderboard({ userId }: { userId: string }) {
  const [entries, setEntries] = useState<LeaderboardEntry[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  // Reload when the user's own count changes, e.g. after logging a dream.
  const { myDreams } = useDreamPosts()
  const myCount = myDreams.length

  useEffect(() => {
    let cancelled = false
    fetchLeaderboard().then((result) => {
      if (cancelled) return
      setEntries(result.entries)
      setError(result.error)
    })
    return () => {
      cancelled = true
    }
  }, [myCount])

  if (error) return <FormError message={error} />
  if (!entries) return <p className="text-sm text-moon-500">Loading...</p>

  const top = entries.filter((entry) => entry.rank <= 10)
  const me = entries.find((entry) => entry.userId === userId)
  const meOutsideTop = me && me.rank > 10 ? me : null

  return (
    <div className="space-y-2">
      <p className="text-xs text-moon-500">Dreams logged, private ones included</p>
      <ol className="space-y-1">
        {top.map((entry) => (
          <Row key={entry.userId} entry={entry} isMe={entry.userId === userId} />
        ))}
      </ol>
      {meOutsideTop && (
        <ol className="space-y-1 border-t border-midnight-700/60 pt-2">
          <Row entry={meOutsideTop} isMe />
        </ol>
      )}
    </div>
  )
}
