import type { SampleDreamEntry } from '../types/dreamNetwork'
import { DREAM_SYMBOL_WEIGHTS, type DreamSymbolWeight } from './dreamSymbols'

const SYMBOL_POOL: DreamSymbolWeight[] = DREAM_SYMBOL_WEIGHTS

const NOTE_TEMPLATES: Array<(symbol: string) => string> = [
  (s) => `${s} again — same as last time, but the details had shifted.`,
  (s) => `Started ordinary, then ${s.toLowerCase()} took over and everything sped up.`,
  (s) => `Only a fragment survived waking up: ${s.toLowerCase()}, and a strong feeling of dread.`,
  (s) => `${s} — this time I almost noticed it wasn't real.`,
  (s) => `Vivid one tonight. ${s} was the center of it, oddly calm about it.`,
  (s) => `Brief flash of ${s.toLowerCase()} right before waking.`,
  (s) => `${s}, then the scene dissolved into somewhere I didn't recognize.`,
]

function weightedPick<T extends { weight: number }>(pool: T[], exclude: Set<string>, key: (t: T) => string): T {
  const available = pool.filter((item) => !exclude.has(key(item)))
  const total = available.reduce((sum, item) => sum + item.weight, 0)
  let roll = Math.random() * total
  for (const item of available) {
    roll -= item.weight
    if (roll <= 0) return item
  }
  return available[available.length - 1]
}

function pickSymbols(count: number): string[] {
  const chosen = new Set<string>()
  for (let i = 0; i < count; i += 1) {
    const pick = weightedPick(SYMBOL_POOL, chosen, (s) => s.label)
    chosen.add(pick.label)
  }
  return [...chosen]
}

function toDateKey(date: Date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/**
 * Generates plausible dream-journal entries so the network graph has something rich to
 * render before any real journaling has happened. Not wired to the real journal store —
 * purely a preview data source for src/routes/web/DreamWeb.tsx.
 */
export function generateSampleDreamEntries(count = 55, spanDays = 150): SampleDreamEntry[] {
  const usedOffsets = new Set<number>()
  const entries: SampleDreamEntry[] = []

  while (entries.length < count) {
    const offset = -Math.floor(Math.random() * spanDays)
    if (usedOffsets.has(offset)) continue
    usedOffsets.add(offset)

    const date = new Date()
    date.setDate(date.getDate() + offset)

    const symbolCount = 1 + Math.floor(Math.random() * 4)
    const symbols = pickSymbols(symbolCount)
    const template = NOTE_TEMPLATES[Math.floor(Math.random() * NOTE_TEMPLATES.length)]

    entries.push({
      date: toDateKey(date),
      note: template(symbols[0]),
      symbols,
    })
  }

  return entries.sort((a, b) => a.date.localeCompare(b.date))
}
