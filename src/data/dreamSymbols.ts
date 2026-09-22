export interface DreamSymbolWeight {
  label: string
  /** relative frequency used only by the sample-data generator */
  weight: number
}

// The weight is what makes a symbol a "hub" in the Dream Web graph — it has no effect
// on real journal entries, which simply pick from `DREAM_SYMBOLS` below.
export const DREAM_SYMBOL_WEIGHTS: DreamSymbolWeight[] = [
  { label: 'Flying', weight: 6 },
  { label: 'Falling', weight: 6 },
  { label: 'Being chased', weight: 6 },
  { label: 'Teeth falling out', weight: 5 },
  { label: 'Water', weight: 5 },
  { label: 'Childhood home', weight: 5 },
  { label: 'A stranger', weight: 3 },
  { label: 'Exam anxiety', weight: 3 },
  { label: 'Losing something', weight: 3 },
  { label: 'Missing a flight', weight: 3 },
  { label: 'A locked door', weight: 3 },
  { label: 'Unstable text', weight: 3 },
  { label: 'A deceased relative', weight: 2 },
  { label: 'Talking animal', weight: 1 },
  { label: 'Time loop', weight: 1 },
  { label: 'A storm', weight: 1 },
  { label: 'Underground tunnels', weight: 1 },
  { label: 'Turning into someone else', weight: 1 },
]

export const DREAM_SYMBOLS: string[] = DREAM_SYMBOL_WEIGHTS.map((s) => s.label)
