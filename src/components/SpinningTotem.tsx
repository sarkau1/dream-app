export default function SpinningTotem() {
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="totem-wobble">
        <div className="totem-blur">
          <svg width="90" height="130" viewBox="0 0 100 140" aria-hidden="true">
            <defs>
              <linearGradient id="totemBody" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--color-nebula-300)" />
                <stop offset="55%" stopColor="var(--color-nebula-500)" />
                <stop offset="100%" stopColor="var(--color-midnight-700)" />
              </linearGradient>
            </defs>
            <rect x="44" y="4" width="12" height="20" rx="4" fill="url(#totemBody)" />
            <path
              d="M18 26 Q50 12 82 26 L64 92 Q50 138 36 92 Z"
              fill="url(#totemBody)"
            />
            <ellipse cx="50" cy="26" rx="32" ry="9" fill="rgba(244,242,253,0.25)" />
          </svg>
        </div>
      </div>
      <div className="totem-shadow h-2 w-16 rounded-full bg-nebula-500/40 blur-sm" />
      <p className="text-xs uppercase tracking-wide text-moon-500">Still spinning?</p>
    </div>
  )
}
