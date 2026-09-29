import { useId, type ReactNode } from 'react'

const SIZE = 148
const STROKE = 12
const RADIUS = (SIZE - STROKE) / 2
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

/** The day's progress as a glowing ring, with whatever goes in the middle. */
export default function ProgressRing({
  done,
  total,
  label,
  children,
}: {
  done: number
  total: number
  /** Spoken instead of the ring, e.g. "3 of 5 habits done today". */
  label: string
  children: ReactNode
}) {
  const id = useId()
  const fraction = total === 0 ? 0 : done / total
  const complete = total > 0 && done === total

  return (
    <div role="img" aria-label={label} className="relative h-[148px] w-[148px] shrink-0">
      <svg
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        className={`h-full w-full -rotate-90 ${complete ? 'ring-glow' : ''}`}
        aria-hidden
      >
        <defs>
          <linearGradient id={`${id}-g`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#7c5cff" />
            <stop offset="1" stopColor="#5ee6c8" />
          </linearGradient>
        </defs>
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          fill="none"
          stroke="currentColor"
          strokeWidth={STROKE}
          className="text-midnight-800"
        />
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          fill="none"
          stroke={`url(#${id}-g)`}
          strokeWidth={STROKE}
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={CIRCUMFERENCE * (1 - fraction)}
          style={{ transition: 'stroke-dashoffset 0.7s cubic-bezier(0.34, 1.2, 0.64, 1)' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        {children}
      </div>
    </div>
  )
}
