import type { DreamGraph, DreamGraphEdge, DreamGraphNode } from '../types/dreamNetwork'
import type { SampleDreamEntry } from '../types/dreamNetwork'

function makeNode(id: string, type: DreamGraphNode['type'], label: string, extra: Partial<DreamGraphNode> = {}): DreamGraphNode {
  const angle = Math.random() * Math.PI * 2
  const radius = 40 + Math.random() * 60
  return {
    id,
    type,
    label,
    degree: 0,
    x: Math.cos(angle) * radius,
    y: Math.sin(angle) * radius,
    vx: 0,
    vy: 0,
    pinned: false,
    ...extra,
  }
}

/**
 * Turns dream-journal entries into an Obsidian-style graph: one node per entry, one node
 * per recurring symbol, and an edge wherever an entry mentions a symbol. Entries that share
 * enough symbols also get a direct edge, so tight clusters read as connected even when no
 * single symbol dominates.
 */
export function buildDreamGraph(entries: SampleDreamEntry[]): DreamGraph {
  const nodes = new Map<string, DreamGraphNode>()
  const edges: DreamGraphEdge[] = []
  const entrySymbols = new Map<string, Set<string>>()

  for (const entry of entries) {
    const entryId = `entry:${entry.date}`
    nodes.set(entryId, makeNode(entryId, 'entry', entry.date, { date: entry.date, note: entry.note }))
    entrySymbols.set(entryId, new Set())

    for (const symbol of entry.symbols) {
      const symbolId = `symbol:${symbol}`
      if (!nodes.has(symbolId)) {
        nodes.set(symbolId, makeNode(symbolId, 'symbol', symbol))
      }
      edges.push({ source: entryId, target: symbolId })
      entrySymbols.get(entryId)!.add(symbolId)
    }
  }

  // Direct entry-to-entry edges when two nights share 2+ symbols — the graph's "co-citation" links.
  const entryIds = [...entrySymbols.keys()]
  for (let i = 0; i < entryIds.length; i += 1) {
    for (let j = i + 1; j < entryIds.length; j += 1) {
      const a = entrySymbols.get(entryIds[i])!
      const b = entrySymbols.get(entryIds[j])!
      let shared = 0
      for (const s of a) if (b.has(s)) shared += 1
      if (shared >= 2) edges.push({ source: entryIds[i], target: entryIds[j] })
    }
  }

  for (const edge of edges) {
    const source = nodes.get(edge.source)
    const target = nodes.get(edge.target)
    if (source) source.degree += 1
    if (target) target.degree += 1
  }

  return { nodes: [...nodes.values()], edges }
}
