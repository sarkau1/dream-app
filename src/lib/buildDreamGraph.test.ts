import { describe, expect, it } from 'vitest'
import { buildDreamGraph } from './buildDreamGraph'

function degrees(entries: Parameters<typeof buildDreamGraph>[0]) {
  const graph = buildDreamGraph(entries)
  return Object.fromEntries(graph.nodes.map((node) => [node.id, node.degree]))
}

describe('buildDreamGraph', () => {
  it('keeps two dreams from the same night as separate nodes', () => {
    const graph = buildDreamGraph([
      { id: 'a', date: '2026-09-24', note: 'First', symbols: ['water'] },
      { id: 'b', date: '2026-09-24', note: 'Second', symbols: ['door'] },
    ])
    const entries = graph.nodes.filter((node) => node.type === 'entry')
    expect(entries.map((node) => node.note)).toEqual(['First', 'Second'])
  })

  it('merges symbols regardless of case and ignores repeats within a dream', () => {
    expect(
      degrees([
        { id: 'a', date: '2026-09-23', note: '', symbols: ['Water'] },
        { id: 'b', date: '2026-09-24', note: '', symbols: ['water', 'WATER'] },
      ]),
    ).toEqual({ 'entry:a': 1, 'symbol:water': 2, 'entry:b': 1 })
  })

  it('links dreams directly only when they share two or more symbols', () => {
    const graph = buildDreamGraph([
      { id: 'a', date: '2026-09-22', note: '', symbols: ['water', 'door', 'cat'] },
      { id: 'b', date: '2026-09-23', note: '', symbols: ['water', 'door'] },
      { id: 'c', date: '2026-09-24', note: '', symbols: ['cat'] },
    ])
    const direct = graph.edges.filter((edge) => edge.target.startsWith('entry:'))
    expect(direct).toEqual([{ source: 'entry:a', target: 'entry:b' }])
  })
})
