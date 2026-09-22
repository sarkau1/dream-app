export type RegionAccent = 'nebula' | 'aurora' | 'moon'

export interface DreamRegion {
  id: string
  name: string
  tagline: string
  description: string
  unlockAt: number
  accent: RegionAccent
}

export interface DreamRegionStatus extends DreamRegion {
  unlocked: boolean
}
