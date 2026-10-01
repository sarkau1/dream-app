import { useId } from 'react'

const HALF = 'M0,-48 A48,48 0 0 1 0,48 A24,24 0 0 1 0,0 A24,24 0 0 0 0,-48 Z'

/** The Dusk & Dawn mark: the dawn and dusk halves of the home page's disc (and the app icon). */
export default function LogoMark({ className = '' }: { className?: string }) {
  // Unique gradient ids, since the mark can be on the page more than once.
  const id = useId()
  return (
    <svg viewBox="-50 -50 100 100" className={className} aria-hidden="true">
      <defs>
        <linearGradient id={`${id}dawn`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fff7e0" />
          <stop offset="0.6" stopColor="#ffd28a" />
          <stop offset="1" stopColor="#ff9e7a" />
        </linearGradient>
        <linearGradient id={`${id}dusk`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#7c5cff" />
          <stop offset="1" stopColor="#1d1a45" />
        </linearGradient>
      </defs>
      <g transform="rotate(-30)">
        <path d={HALF} fill={`url(#${id}dawn)`} />
        <path d={HALF} fill={`url(#${id}dusk)`} transform="rotate(180)" />
        <circle cy="24" r="7" fill="#1d1a45" />
        <circle cy="-24" r="7" fill="#ffe7b0" />
      </g>
      <circle r="48.5" fill="none" stroke="#d9ccff" strokeOpacity="0.5" strokeWidth="2" />
    </svg>
  )
}
