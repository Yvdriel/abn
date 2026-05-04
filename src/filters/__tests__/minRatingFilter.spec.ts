import { describe, it, expect } from 'vitest'
import { minRatingFilter } from '../minRatingFilter'
import { makeShow } from '@/__tests__/fixtures'

describe('minRatingFilter', () => {
  it('passes shows above the threshold', () => {
    const pred = minRatingFilter.predicate({ min: 7 })
    expect(pred(makeShow({ rating: { average: 8 } }))).toBe(true)
  })

  it('treats >= as inclusive', () => {
    const pred = minRatingFilter.predicate({ min: 7 })
    expect(pred(makeShow({ rating: { average: 7 } }))).toBe(true)
  })

  it('treats null rating as 0 (fails when threshold > 0)', () => {
    const pred = minRatingFilter.predicate({ min: 7 })
    expect(pred(makeShow({ rating: { average: null } }))).toBe(false)
  })

  it('with min=0 is inactive', () => {
    expect(minRatingFilter.isActive({ min: 0 })).toBe(false)
    expect(minRatingFilter.predicate({ min: 0 })(makeShow({ rating: { average: null } }))).toBe(
      true,
    )
  })

  it('round-trips serialize/deserialize', () => {
    expect(minRatingFilter.serialize({ min: 0 })).toBeUndefined()
    expect(minRatingFilter.serialize({ min: 7.5 })).toBe('7.5')
    expect(minRatingFilter.deserialize('7.5')).toEqual({ min: 7.5 })
    expect(minRatingFilter.deserialize('garbage')).toEqual({ min: 0 })
    expect(minRatingFilter.deserialize('99')).toEqual({ min: 10 })
  })
})
