import { describe, expect, it } from 'vitest'
import { matchesFilter, toPost, withKnownCounts } from './dreamRows'
import { ALL_DREAMS_FILTER, type DreamPost } from '../types/dream'

const TODAY = '2026-09-30'

const post: DreamPost = {
  id: 'd1',
  userId: 'u1',
  authorName: 'Dreamer',
  createdAt: '2026-09-29T07:00:00Z',
  title: 't',
  body: 'b',
  mood: 'Lucid',
  symbols: [],
  isPrivate: false,
  dreamtOn: '2026-09-25',
}

describe('matchesFilter', () => {
  it('lets everything through with no filter', () => {
    expect(matchesFilter({ mood: null, dreamtOn: '2001-01-01' }, ALL_DREAMS_FILTER, TODAY)).toBe(true)
  })

  it('matches the mood exactly', () => {
    expect(matchesFilter(post, { mood: 'Lucid', period: 'all' }, TODAY)).toBe(true)
    expect(matchesFilter(post, { mood: 'Nightmare', period: 'all' }, TODAY)).toBe(false)
  })

  it('counts the period back from today, including its first day', () => {
    const week = { mood: null, period: 'week' } as const
    expect(matchesFilter({ ...post, dreamtOn: '2026-09-23' }, week, TODAY)).toBe(true)
    expect(matchesFilter({ ...post, dreamtOn: '2026-09-22' }, week, TODAY)).toBe(false)
  })

  it('needs both mood and period to match', () => {
    expect(matchesFilter(post, { mood: 'Lucid', period: 'week' }, TODAY)).toBe(true)
    expect(matchesFilter({ ...post, dreamtOn: '2026-01-01' }, { mood: 'Lucid', period: 'week' }, TODAY)).toBe(false)
  })
})

describe('withKnownCounts', () => {
  it('keeps the counts the feed already showed for an edited dream', () => {
    const shown = { ...post, commentCount: 4, reactionCount: 2, reactedByMe: true }
    expect(withKnownCounts({ ...post, title: 'edited' }, shown)).toMatchObject({
      title: 'edited',
      commentCount: 4,
      reactionCount: 2,
      reactedByMe: true,
    })
  })

  it('starts a new dream at zero', () => {
    expect(withKnownCounts(post, undefined)).toMatchObject({
      commentCount: 0,
      reactionCount: 0,
      reactedByMe: false,
    })
  })
})

describe('toPost', () => {
  const row = {
    id: 'd1',
    user_id: 'u1',
    title: 't',
    body: 'b',
    mood: null,
    symbols: null,
    is_private: false,
    dreamt_on: '2026-09-25',
    created_at: '2026-09-29T07:00:00Z',
    author_name: 'Anna',
  }

  it('reads counts when the row has them', () => {
    expect(toPost({ ...row, comment_count: 3, reaction_count: 1, reacted_by_me: false })).toMatchObject({
      authorName: 'Anna',
      symbols: [],
      commentCount: 3,
      reactionCount: 1,
      reactedByMe: false,
    })
  })

  it('leaves counts out when the row has none (e.g. after a write)', () => {
    expect(toPost(row)).not.toHaveProperty('commentCount')
  })
})
