import type { DreamPost } from '../types/dream'

/** A dream's mood and symbols as chips; renders nothing when it has neither. */
export default function DreamTags({
  dream,
  large = false,
  className = '',
}: {
  dream: Pick<DreamPost, 'mood' | 'symbols'>
  large?: boolean
  className?: string
}) {
  if (!dream.mood && dream.symbols.length === 0) return null

  const size = large ? 'px-3 py-1' : 'px-2.5 py-0.5'
  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {dream.mood && (
        <span
          className={`rounded-full border border-nebula-400 bg-nebula-500/20 text-xs text-nebula-200 ${size}`}
        >
          {dream.mood}
        </span>
      )}
      {dream.symbols.map((symbol) => (
        <span
          key={symbol}
          className={`rounded-full border border-midnight-700 text-xs text-moon-400 ${size}`}
        >
          {symbol}
        </span>
      ))}
    </div>
  )
}
