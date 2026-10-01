import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/useAuth'
import Leaderboard from '../components/Leaderboard'
import { cardClass } from '../styles/ui'
import { useDocumentTitle } from '../lib/useDocumentTitle'

type Side = 'wake' | 'sleep'

// The two halves of the day. Each half of the yin-yang and its label lead to the same page.
const sides = {
  wake: {
    to: '/habits',
    icon: '☀',
    title: 'Waking life',
    tagline: 'Stay accountable to your habits',
    description: 'Tick off your routine every day and keep the streak alive.',
  },
  sleep: {
    to: '/journal',
    icon: '☾',
    title: 'Sleeping life',
    tagline: 'Write down your dreams',
    description: 'Catch every dream before it fades, private until you share it.',
  },
} satisfies Record<Side, object>

// The light half: the right side of the circle with its head at the bottom. The dark half is the
// same shape turned half a circle, and each head carries a dot of the other colour.
const WAKE_PATH = 'M0,-48 A48,48 0 0 1 0,48 A24,24 0 0 1 0,0 A24,24 0 0 0 0,-48 Z'

function SideLink({ side, onHover }: { side: Side; onHover: (side: Side | null) => void }) {
  const s = sides[side]
  const wake = side === 'wake'
  return (
    <Link
      to={s.to}
      onMouseEnter={() => onHover(side)}
      onMouseLeave={() => onHover(null)}
      onFocus={() => onHover(side)}
      onBlur={() => onHover(null)}
      className="group block space-y-2 rounded-2xl p-4 text-center transition-colors hover:bg-midnight-800/40"
    >
      <p className={`text-xs font-semibold tracking-[0.3em] uppercase ${wake ? 'text-amber-200' : 'text-nebula-300'}`}>
        <span aria-hidden="true">{s.icon}</span> {s.title}
      </p>
      <h2 className="text-xl font-medium text-moon-100 group-hover:text-aurora-200">{s.tagline}</h2>
      <p className="text-sm text-moon-400">{s.description}</p>
    </Link>
  )
}

// A half's name inside its head, in the other half's colour like the classic dot. The wrapper is
// placed in the turning circle; the label inside it turns back the other way to stay upright.
function HeadLabel({ side, top, onHover }: { side: Side; top: string; onHover: (side: Side | null) => void }) {
  const s = sides[side]
  const wake = side === 'wake'
  return (
    <div className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2" style={{ top }}>
      <Link
        to={s.to}
        onMouseEnter={() => onHover(side)}
        onMouseLeave={() => onHover(null)}
        onFocus={() => onHover(side)}
        onBlur={() => onHover(null)}
        className="yin-yang-label flex flex-col items-center gap-1 rounded-full p-2"
      >
        <span
          className={`flex size-9 items-center justify-center rounded-full text-lg ${
            wake ? 'bg-midnight-800 text-amber-200' : 'bg-amber-100 text-midnight-800'
          }`}
          aria-hidden="true"
        >
          {s.icon}
        </span>
        <span className={`text-xs font-semibold tracking-widest whitespace-nowrap uppercase ${wake ? 'text-midnight-800' : 'text-amber-100'}`}>
          {s.title}
        </span>
      </Link>
    </div>
  )
}

export default function Home() {
  useDocumentTitle(null)
  const { user } = useAuth()
  const navigate = useNavigate()
  const [active, setActive] = useState<Side | null>(null)

  // The halves are a pointer shortcut; keyboard and screen-reader users have the labels.
  const half = (side: Side, className: string, fill: string, transform?: string) => (
    <path
      d={WAKE_PATH}
      transform={transform}
      fill={fill}
      className={className}
      onClick={() => navigate(sides[side].to)}
      onMouseEnter={() => setActive(side)}
      onMouseLeave={() => setActive(null)}
    />
  )

  return (
    <div className="space-y-16">
      <section className="mx-auto max-w-2xl text-center">
        <h1 className="font-serif text-5xl text-moon-100 sm:text-6xl">
          Live your{' '}
          <span className="bg-gradient-to-r from-amber-200 via-nebula-300 to-aurora-300 bg-clip-text text-transparent italic">
            best life
          </span>
        </h1>
      </section>

      {/* The yin-yang, then the two halves described under it. Each half's label sits in its head
          (centre of the head: 26% and 74% down) and turns with it, so a label is always on its half. */}
      <section className="space-y-8">
        <div className="yin-yang-wrap flex justify-center">
          <div className="yin-yang relative size-72 sm:size-80" data-active={active ?? undefined}>
            <svg viewBox="-50 -50 100 100" className="size-full" aria-hidden="true">
              <defs>
                <linearGradient id="yy-wake" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#fff7e0" />
                  <stop offset="100%" stopColor="#ffd28a" />
                </linearGradient>
                <linearGradient id="yy-sleep" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="var(--color-midnight-600)" />
                  <stop offset="100%" stopColor="var(--color-midnight-950)" />
                </linearGradient>
              </defs>
              {half('wake', 'yy-wake', 'url(#yy-wake)')}
              {half('sleep', 'yy-sleep', 'url(#yy-sleep)', 'rotate(180)')}
              <circle r="48.5" fill="none" stroke="var(--color-nebula-400)" strokeOpacity="0.5" strokeWidth="1" pointerEvents="none" />
            </svg>
            <HeadLabel side="wake" top="74%" onHover={setActive} />
            <HeadLabel side="sleep" top="26%" onHover={setActive} />
          </div>
        </div>
        <div className="mx-auto grid max-w-2xl gap-4 sm:grid-cols-2">
          <SideLink side="wake" onHover={setActive} />
          <SideLink side="sleep" onHover={setActive} />
        </div>
      </section>

      {/* Awareness is what carries one half into the other. */}
      <section className="flex justify-center">
        <Link to="/lucid" className="hex hex-aurora hex-float">
          <span className="hex-face">
            <span className="text-3xl text-aurora-200" aria-hidden="true">
              👁
            </span>
            <span className="text-lg leading-snug font-medium text-moon-100">Practice all-day awareness</span>
            <span className="text-sm text-moon-400">Check reality and notice the signs that keep coming back.</span>
          </span>
        </Link>
      </section>

      {/* The counts come from a function only signed-in users may call. */}
      {user && (
        <section className={`mx-auto max-w-md space-y-3 p-5 ${cardClass}`}>
          <h2 className="text-lg font-medium text-moon-100">Top dreamers</h2>
          <Leaderboard userId={user.id} />
        </section>
      )}
    </div>
  )
}
