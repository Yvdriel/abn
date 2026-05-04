import type { TvMazeShow } from '@/types/tvmaze'

export function scoreShowAgainstQuery(show: TvMazeShow, q: string): number {
  const query = q.trim().toLowerCase()
  if (query.length === 0) return 0
  const name = (show.name ?? '').toLowerCase()
  if (name === query) return 100
  if (name.startsWith(query)) return 60
  if (name.includes(query)) return 30
  return 0
}
