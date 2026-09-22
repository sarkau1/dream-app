export interface DreamWalkRoll {
  dc: number
  success: string
  failure: string
}

export interface DreamWalkChoice {
  id: string
  label: string
  next?: string
  roll?: DreamWalkRoll
}

export interface DreamWalkNode {
  id: string
  title: string
  region?: string
  character?: string
  tags?: string[]
  text: string
  terminal: boolean
  choices: DreamWalkChoice[]
}

export interface DreamWalkGraph {
  startId: string
  nodes: Record<string, DreamWalkNode>
}
