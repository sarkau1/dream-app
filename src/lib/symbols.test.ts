import { describe, expect, it } from 'vitest'
import { symbolsByFrequency } from './symbols'

describe('symbolsByFrequency', () => {
  it('orders by how many dreams use a sign, then alphabetically', () => {
    expect(
      symbolsByFrequency([
        { symbols: ['water', 'door'] },
        { symbols: ['Water', 'cat'] },
        { symbols: ['door', 'water'] },
        { symbols: ['bird'] },
      ]),
    ).toEqual(['water', 'door', 'bird', 'cat'])
  })

  it('counts a sign once per dream even if repeated in different case', () => {
    expect(symbolsByFrequency([{ symbols: ['Moon', 'moon'] }, { symbols: ['sun'] }, { symbols: ['sun'] }])).toEqual([
      'sun',
      'moon',
    ])
  })

  it('is empty with no dreams', () => {
    expect(symbolsByFrequency([])).toEqual([])
  })
})
