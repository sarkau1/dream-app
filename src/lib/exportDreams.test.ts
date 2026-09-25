import { describe, expect, it } from 'vitest'
import { dreamsToJson, dreamsToMarkdown } from './exportDreams'
import type { DreamPost } from '../types/dream'

const dream: DreamPost = {
  id: 'd1',
  userId: 'u1',
  authorName: 'Dreamer',
  createdAt: '2026-09-24T07:00:00Z',
  title: 'The flooded library',
  body: 'Water up to the shelves.\nI could breathe under it.',
  mood: 'Lucid',
  symbols: ['water', 'books'],
  isPrivate: true,
  dreamtOn: '2026-09-23',
}

describe('dreamsToMarkdown', () => {
  it('writes a heading, the details and the full text for each dream', () => {
    const markdown = dreamsToMarkdown([dream], '2026-09-25')
    expect(markdown).toContain('Exported 2026-09-25 · 1 dreams')
    expect(markdown).toContain('## 2026-09-23 — The flooded library')
    expect(markdown).toContain('_Mood: Lucid · Signs: water, books · Private_')
    expect(markdown).toContain('I could breathe under it.')
  })

  it('leaves out mood and signs when a dream has none', () => {
    const markdown = dreamsToMarkdown([{ ...dream, mood: null, symbols: [], isPrivate: false }], 'x')
    expect(markdown).toContain('_Shared in the Dream Feed_')
  })
})

describe('dreamsToJson', () => {
  it('keeps every field of the dream but not the author details', () => {
    const parsed = JSON.parse(dreamsToJson([dream], '2026-09-25'))
    expect(parsed.dreams[0]).toEqual({
      id: 'd1',
      dreamtOn: '2026-09-23',
      createdAt: '2026-09-24T07:00:00Z',
      title: 'The flooded library',
      body: dream.body,
      mood: 'Lucid',
      symbols: ['water', 'books'],
      isPrivate: true,
    })
  })
})
