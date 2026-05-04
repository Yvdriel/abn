import { describe, it, expect } from 'vitest'
import { genreFilter } from '../genreFilter'
import { makeShow } from '@/__tests__/fixtures'

describe('genreFilter', () => {
  it('matches when any of the values is in show.genres', () => {
    const pred = genreFilter.predicate({ values: ['drama'] })
    expect(pred(makeShow({ genres: ['Drama', 'Crime'] }))).toBe(true)
    expect(pred(makeShow({ genres: ['Comedy'] }))).toBe(false)
  })

  it('is case-insensitive', () => {
    const pred = genreFilter.predicate({ values: ['DRAMA'] })
    expect(pred(makeShow({ genres: ['drama'] }))).toBe(true)
  })

  it('with empty values is inactive (always true)', () => {
    expect(genreFilter.isActive({ values: [] })).toBe(false)
    expect(genreFilter.predicate({ values: [] })(makeShow({ genres: [] }))).toBe(true)
  })

  it('round-trips serialize/deserialize', () => {
    expect(genreFilter.serialize({ values: [] })).toBeUndefined()
    expect(genreFilter.serialize({ values: ['Drama', 'Comedy'] })).toBe('drama,comedy')
    expect(genreFilter.deserialize('drama,comedy')).toEqual({ values: ['drama', 'comedy'] })
    expect(genreFilter.deserialize(undefined)).toEqual({ values: [] })
  })
})
