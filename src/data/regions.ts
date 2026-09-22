import type { DreamRegion } from '../types/meta'

/**
 * The Dream Atlas is deliberately data-only: each new region is one entry
 * here, gated by a Dream Essence threshold earned across every game. Add
 * entries as new regions/games ship — nothing else needs to change.
 */
export const dreamRegions: DreamRegion[] = [
  {
    id: 'threshold-marshes',
    name: 'Threshold Marshes',
    tagline: 'Where every dreamer starts',
    description:
      'Shallow, half-lit water that mirrors whatever you expect to see. The easiest place to catch your first dream sign.',
    unlockAt: 0,
    accent: 'moon',
  },
  {
    id: 'mirror-bazaar',
    name: 'Mirror Bazaar',
    tagline: 'Faces are never quite right here',
    description:
      'A market stitched from a hundred half-remembered streets. Merchants glitch mid-sentence and reflections lag a beat behind.',
    unlockAt: 60,
    accent: 'nebula',
  },
  {
    id: 'gravity-bloom-canyon',
    name: 'Gravity Bloom Canyon',
    tagline: 'Falling is optional',
    description:
      'Canyon walls that bloom upward instead of down. Most dreamers learn to fly by accident here first.',
    unlockAt: 160,
    accent: 'aurora',
  },
  {
    id: 'neon-undertow',
    name: 'Neon Undertow',
    tagline: 'The city that keeps rewriting its signs',
    description:
      'Storefront text rewrites itself every time you look away — a whole district built for reality-check practice.',
    unlockAt: 320,
    accent: 'nebula',
  },
  {
    id: 'starfall-peak',
    name: 'Starfall Peak',
    tagline: 'Stable enough to build a habit that sticks',
    description:
      'The summit dreamers describe as "obviously a dream" the moment they arrive — full lucidity, held on purpose.',
    unlockAt: 550,
    accent: 'aurora',
  },
]
