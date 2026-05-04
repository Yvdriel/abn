import { describe, it, expect } from 'vitest'
import { composeFilters } from '../compose'
import { makeShow } from '@/__tests__/fixtures'

describe('composeFilters', () => {
  it('empty list yields constant true', () => {
    const pred = composeFilters([])
    expect(pred(makeShow())).toBe(true)
  })

  it('all-active-and-pass yields true', () => {
    const pred = composeFilters([
      { id: 'genre', params: { values: ['drama'] } },
      { id: 'minRating', params: { min: 5 } },
    ])
    expect(pred(makeShow({ genres: ['Drama'], rating: { average: 8 } }))).toBe(true)
  })

  it('AND-composes: one failing filter fails the whole', () => {
    const pred = composeFilters([
      { id: 'genre', params: { values: ['drama'] } },
      { id: 'minRating', params: { min: 9 } },
    ])
    expect(pred(makeShow({ genres: ['Drama'], rating: { average: 8 } }))).toBe(false)
  })

  it('order independent', () => {
    const a = composeFilters([
      { id: 'genre', params: { values: ['drama'] } },
      { id: 'minRating', params: { min: 7 } },
    ])
    const b = composeFilters([
      { id: 'minRating', params: { min: 7 } },
      { id: 'genre', params: { values: ['drama'] } },
    ])
    const show = makeShow({ genres: ['Drama'], rating: { average: 8 } })
    expect(a(show)).toBe(b(show))
  })
})
