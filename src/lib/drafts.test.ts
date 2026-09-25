import { describe, expect, it } from 'vitest'
import { draftIsOutdated } from './drafts'
import type { DreamInput } from '../types/dream'

const saved: DreamInput = {
  title: 'Flying',
  body: 'Over the harbour.',
  mood: null,
  symbols: ['sky'],
  isPrivate: true,
  dreamtOn: '2026-09-24',
}

describe('draftIsOutdated', () => {
  it('is false while the saved dream is what the draft started from', () => {
    expect(draftIsOutdated({ values: { ...saved, body: 'Typing...' }, base: saved }, saved)).toBe(false)
  })

  it('is true once the saved dream has changed elsewhere', () => {
    const editedElsewhere = { ...saved, body: 'Over the harbour, then the hills.' }
    expect(draftIsOutdated({ values: saved, base: saved }, editedElsewhere)).toBe(true)
  })

  it('can’t tell for drafts saved before the base was stored', () => {
    expect(draftIsOutdated({ values: saved, base: null }, { ...saved, title: 'Other' })).toBe(false)
  })
})
