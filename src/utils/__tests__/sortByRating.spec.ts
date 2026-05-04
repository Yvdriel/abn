import { describe, it, expect } from 'vitest'
import { sortByRating } from '../sortByRating'
import { makeShow } from '@/__tests__/fixtures'

describe('sortByRating', () => {
  it('sorts in descending order by rating', () => {
    const shows = [
      makeShow({ id: 1, rating: { average: 7 } }),
      makeShow({ id: 2, rating: { average: 9 } }),
      makeShow({ id: 3, rating: { average: 8 } }),
    ]
    const sorted = [...shows].sort(sortByRating).map((s) => s.id)
    expect(sorted).toEqual([2, 3, 1])
  })

  it('places null ratings last', () => {
    const shows = [
      makeShow({ id: 1, rating: { average: null } }),
      makeShow({ id: 2, rating: { average: 8 } }),
      makeShow({ id: 3, rating: { average: null } }),
      makeShow({ id: 4, rating: { average: 9 } }),
    ]
    const sorted = [...shows].sort(sortByRating).map((s) => s.id)
    expect(sorted.slice(0, 2)).toEqual([4, 2])
    expect(sorted.slice(2).sort()).toEqual([1, 3])
  })

  it('keeps two nulls in deterministic order via weight then id', () => {
    const shows = [
      makeShow({ id: 5, weight: 10, rating: { average: null } }),
      makeShow({ id: 2, weight: 50, rating: { average: null } }),
      makeShow({ id: 3, weight: 50, rating: { average: null } }),
    ]
    const sorted = [...shows].sort(sortByRating).map((s) => s.id)
    expect(sorted).toEqual([2, 3, 5])
  })

  it('breaks ties on equal rating by weight desc', () => {
    const shows = [
      makeShow({ id: 1, weight: 30, rating: { average: 8 } }),
      makeShow({ id: 2, weight: 90, rating: { average: 8 } }),
    ]
    const sorted = [...shows].sort(sortByRating).map((s) => s.id)
    expect(sorted).toEqual([2, 1])
  })

  it('breaks weight ties by id asc', () => {
    const shows = [
      makeShow({ id: 7, weight: 50, rating: { average: 8 } }),
      makeShow({ id: 3, weight: 50, rating: { average: 8 } }),
    ]
    const sorted = [...shows].sort(sortByRating).map((s) => s.id)
    expect(sorted).toEqual([3, 7])
  })

  it('handles empty array', () => {
    expect([].sort(sortByRating)).toEqual([])
  })
})
