import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { dreamRegions } from '../data/regions'
import type { DreamRegionStatus } from '../types/meta'

const ESSENCE_KEY = 'dreamapp:essence'

interface MetaProgressContextValue {
  totalEssence: number
  regions: DreamRegionStatus[]
  currentRegion: DreamRegionStatus
  nextRegion: DreamRegionStatus | null
  progressToNext: number
  earnEssence: (amount: number) => void
}

function loadEssence(): number {
  try {
    const raw = localStorage.getItem(ESSENCE_KEY)
    const parsed = raw ? Number(raw) : 0
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0
  } catch {
    return 0
  }
}

const MetaProgressContext = createContext<MetaProgressContextValue | undefined>(undefined)

export function MetaProgressProvider({ children }: { children: ReactNode }) {
  const [totalEssence, setTotalEssence] = useState<number>(loadEssence)

  useEffect(() => {
    localStorage.setItem(ESSENCE_KEY, String(totalEssence))
  }, [totalEssence])

  function earnEssence(amount: number) {
    if (amount <= 0) return
    setTotalEssence((prev) => prev + amount)
  }

  const value = useMemo<MetaProgressContextValue>(() => {
    const sorted = [...dreamRegions].sort((a, b) => a.unlockAt - b.unlockAt)
    const regions: DreamRegionStatus[] = sorted.map((region) => ({
      ...region,
      unlocked: totalEssence >= region.unlockAt,
    }))

    const unlocked = regions.filter((r) => r.unlocked)
    const currentRegion = unlocked[unlocked.length - 1] ?? regions[0]
    const nextRegion = regions.find((r) => !r.unlocked) ?? null

    const progressToNext = nextRegion
      ? Math.min(
          1,
          (totalEssence - currentRegion.unlockAt) / (nextRegion.unlockAt - currentRegion.unlockAt),
        )
      : 1

    return { totalEssence, regions, currentRegion, nextRegion, progressToNext, earnEssence }
  }, [totalEssence])

  return <MetaProgressContext.Provider value={value}>{children}</MetaProgressContext.Provider>
}

export function useMetaProgress() {
  const ctx = useContext(MetaProgressContext)
  if (!ctx) throw new Error('useMetaProgress must be used within a MetaProgressProvider')
  return ctx
}
