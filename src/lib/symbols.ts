import type { DreamPost } from '../types/dream'

/**
 * Every dream sign the user has tagged, most used first (ties alphabetical), lowercased so older
 * mixed-case tags merge with new ones. Feeds the suggestions in DreamForm.
 */
export function symbolsByFrequency(dreams: Pick<DreamPost, 'symbols'>[]): string[] {
  const counts = new Map<string, number>()
  for (const dream of dreams) {
    // A sign repeated within one dream still counts once for it.
    for (const symbol of new Set(dream.symbols.map((s) => s.toLowerCase()))) {
      counts.set(symbol, (counts.get(symbol) ?? 0) + 1)
    }
  }
  return [...counts]
    .sort(([a, countA], [b, countB]) => countB - countA || a.localeCompare(b))
    .map(([symbol]) => symbol)
}
