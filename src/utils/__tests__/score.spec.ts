import { describe, it, expect } from 'vitest'
import { scoreShowAgainstQuery } from '../score'
import { makeShow } from '@/__tests__/fixtures'

describe('scoreShowAgainstQuery', () => {
  it('returns 100 on case-insensitive exact match', () => {
    expect(scoreShowAgainstQuery(makeShow({ name: 'Lost' }), 'lost')).toBe(100)
    expect(scoreShowAgainstQuery(makeShow({ name: 'Lost' }), 'LOST')).toBe(100)
  })

  it('returns 60 on starts-with', () => {
    expect(scoreShowAgainstQuery(makeShow({ name: 'Breaking Bad' }), 'break')).toBe(60)
  })

  it('returns 30 on contains', () => {
    expect(scoreShowAgainstQuery(makeShow({ name: 'The Crown' }), 'crown')).toBe(30)
  })

  it('returns 0 on no match', () => {
    expect(scoreShowAgainstQuery(makeShow({ name: 'Severance' }), 'mando')).toBe(0)
  })

  it('returns 0 on empty query', () => {
    expect(scoreShowAgainstQuery(makeShow({ name: 'Anything' }), '')).toBe(0)
    expect(scoreShowAgainstQuery(makeShow({ name: 'Anything' }), '   ')).toBe(0)
  })

  it('matches names with diacritics literally', () => {
    expect(scoreShowAgainstQuery(makeShow({ name: 'Pokémon' }), 'pokémon')).toBe(100)
  })
})
