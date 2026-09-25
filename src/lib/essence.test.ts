import { describe, expect, it } from 'vitest'
import { ESSENCE_LUCID_DREAM, essenceFromDreams } from './essence'
import type { DreamPost } from '../types/dream'

function dream(mood: DreamPost['mood']): DreamPost {
  return {
    id: crypto.randomUUID(),
    userId: 'u',
    authorName: 'Dreamer',
    createdAt: '2026-09-24T00:00:00Z',
    title: 't',
    body: 'b',
    mood,
    symbols: [],
    isPrivate: false,
    dreamtOn: '2026-09-24',
  }
}

describe('essenceFromDreams', () => {
  it('counts only lucid dreams', () => {
    expect(essenceFromDreams([dream('Lucid'), dream('Nightmare'), dream(null), dream('Lucid')])).toBe(
      2 * ESSENCE_LUCID_DREAM,
    )
  })

  it('is zero with no dreams', () => {
    expect(essenceFromDreams([])).toBe(0)
  })
})
