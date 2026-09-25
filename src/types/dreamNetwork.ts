export type DreamGraphNodeType = 'entry' | 'symbol'

export interface DreamGraphNode {
  id: string
  type: DreamGraphNodeType
  label: string
  /** entry nodes only */
  dreamId?: string
  date?: string
  note?: string
  /** number of edges touching this node, filled in once the graph is built */
  degree: number
  /** simulation state */
  x: number
  y: number
  vx: number
  vy: number
  /** dragged/pinned nodes skip the simulation's own position updates */
  pinned: boolean
}

export interface DreamGraphEdge {
  source: string
  target: string
}

export interface DreamGraph {
  nodes: DreamGraphNode[]
  edges: DreamGraphEdge[]
}

export interface DreamGraphEntry {
  /** the dream's id: several dreams can share a date */
  id: string
  date: string
  note: string
  symbols: string[]
}
