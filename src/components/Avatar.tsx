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

/** The dreamer's initial on their colour. Decorative: the name is always shown next to it. */
export default function Avatar({
  userId,
  name,
  large = false,
}: {
  userId: string
  name: string
  large?: boolean
}) {
  const initial = name.trim().charAt(0).toUpperCase() || '?'
  const size = large ? 'h-14 w-14 text-xl' : 'h-9 w-9 text-sm'
  return (
    <span
      aria-hidden="true"
      className={`flex shrink-0 items-center justify-center rounded-full font-semibold ${size} ${colorFor(userId)}`}
    >
      {initial}
    </span>
  )
}
