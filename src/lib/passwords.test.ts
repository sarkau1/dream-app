import { describe, expect, it } from 'vitest'
import { MIN_PASSWORD_LENGTH, newPasswordProblem } from './passwords'

describe('newPasswordProblem', () => {
  it('rejects passwords that are too short', () => {
    const short = 'a'.repeat(MIN_PASSWORD_LENGTH - 1)
    expect(newPasswordProblem(short, short)).toMatch(/at least/)
  })

  it('rejects a confirmation that does not match', () => {
    expect(newPasswordProblem('long-enough', 'long-enougH')).toMatch(/don't match/)
  })

  it('accepts a matching password of the minimum length', () => {
    const ok = 'a'.repeat(MIN_PASSWORD_LENGTH)
    expect(newPasswordProblem(ok, ok)).toBeNull()
  })
})
