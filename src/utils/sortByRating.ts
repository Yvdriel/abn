import type { TvMazeShow } from '@/types/tvmaze'

export function sortByRating(a: TvMazeShow, b: TvMazeShow): number {
  const aRating = a.rating.average
  const bRating = b.rating.average

  if (aRating === null && bRating === null) {
    if (a.weight !== b.weight) return b.weight - a.weight
    return a.id - b.id
  }
  if (aRating === null) return 1
  if (bRating === null) return -1
  if (aRating !== bRating) return bRating - aRating
  if (a.weight !== b.weight) return b.weight - a.weight
  return a.id - b.id
}
