import { Link } from 'react-router-dom'
import { useMetaProgress } from '../../context/MetaProgressContext'
import type { RegionAccent } from '../../types/meta'

const ACCENT_STYLES: Record<RegionAccent, { border: string; text: string; bg: string }> = {
  nebula: { border: 'border-nebula-400/60', text: 'text-nebula-300', bg: 'bg-nebula-500/10' },
  aurora: { border: 'border-aurora-400/60', text: 'text-aurora-300', bg: 'bg-aurora-400/10' },
  moon: { border: 'border-moon-500/50', text: 'text-moon-300', bg: 'bg-moon-500/10' },
}

export default function DreamAtlas() {
  const { totalEssence, regions, currentRegion, nextRegion, progressToNext } = useMetaProgress()

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-moon-100">Dream Atlas</h1>
        <p className="mt-2 text-moon-300">
          Every game feeds one shared currency — Dream Essence. Earn enough and the map opens
          further. New regions ship over time; this is just the start of it.
        </p>
      </div>

      <div className="rounded-2xl border border-midnight-700 bg-midnight-900/60 p-6">
        <div className="flex items-baseline justify-between">
          <p className="text-sm text-moon-300">Dream Essence</p>
          <p className="text-2xl font-semibold text-aurora-300">{totalEssence}</p>
        </div>
        {nextRegion ? (
          <>
            <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-midnight-700">
              <div
                className="h-full rounded-full bg-nebula-500 transition-all"
                style={{ width: `${Math.round(progressToNext * 100)}%` }}
              />
            </div>
            <p className="mt-2 text-xs text-moon-500">
              {Math.max(0, nextRegion.unlockAt - totalEssence)} more Essence unlocks{' '}
              <span className="text-moon-300">{nextRegion.name}</span>
            </p>
          </>
        ) : (
          <p className="mt-3 text-xs text-aurora-300">Every current region is unlocked.</p>
        )}
      </div>

      <div className="space-y-3">
        {regions.map((region) => {
          const accent = ACCENT_STYLES[region.accent]
          const isCurrent = region.id === currentRegion.id
          return (
            <div
              key={region.id}
              className={`rounded-2xl border p-5 ${
                region.unlocked
                  ? `${accent.border} ${accent.bg}`
                  : 'border-dashed border-midnight-700 opacity-60'
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <h2 className={`text-lg font-medium ${region.unlocked ? accent.text : 'text-moon-500'}`}>
                  {region.name}
                </h2>
                {isCurrent && (
                  <span className="rounded-full bg-nebula-500/20 px-2.5 py-0.5 text-[10px] uppercase tracking-wide text-nebula-300">
                    You are here
                  </span>
                )}
                {!region.unlocked && (
                  <span className="text-xs text-moon-500">{region.unlockAt} Essence</span>
                )}
              </div>
              <p className={`mt-1 text-sm ${region.unlocked ? 'text-moon-300' : 'text-moon-500'}`}>
                {region.tagline}
              </p>
              {region.unlocked && <p className="mt-2 text-sm text-moon-300">{region.description}</p>}
            </div>
          )
        })}
      </div>

      <Link to="/games" className="inline-block text-sm text-moon-500 hover:text-nebula-300">
        &larr; Back to Games
      </Link>
    </div>
  )
}
