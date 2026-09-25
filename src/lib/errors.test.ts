import { describe, expect, it } from 'vitest'
import { friendlyError } from './errors'

describe('friendlyError', () => {
  it('names the broken limit instead of the constraint', () => {
    expect(
      friendlyError('new row for relation "dreams" violates check constraint "dreams_title_length"'),
    ).toMatch(/title can be up to 200/)
  })

  it('explains network failures and missing schema updates', () => {
    expect(friendlyError('TypeError: Failed to fetch')).toMatch(/Can’t reach the server/)
    expect(
      friendlyError("Could not find the table 'public.dreams_with_authors' in the schema cache"),
    ).toMatch(/Re-run supabase\/schema.sql/)
  })

  it('passes human-readable messages through', () => {
    expect(friendlyError('Invalid login credentials')).toBe('Invalid login credentials')
  })
})
