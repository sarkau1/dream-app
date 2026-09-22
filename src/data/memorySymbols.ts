export interface MemorySymbol {
  id: string
  icon: string
  label: string
}

export const memorySymbols: MemorySymbol[] = [
  { id: 'text', icon: '\u{1F551}', label: 'Text instability' },
  { id: 'physics', icon: '\u{1F54A}️', label: 'Impossible physics' },
  { id: 'environment', icon: '\u{1F300}', label: 'Environment mismatch' },
  { id: 'people', icon: '\u{1F464}', label: 'People oddities' },
  { id: 'emotion', icon: '\u{1F30A}', label: 'Emotional intensity' },
  { id: 'symbol', icon: '\u{1F511}', label: 'Recurring symbol' },
  { id: 'trigger', icon: '\u{1F319}', label: 'Lucidity trigger' },
  { id: 'journal', icon: '\u{1F4D3}', label: 'Dream journal' },
]
