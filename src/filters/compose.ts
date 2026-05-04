import type { ActiveFilter } from '@/types/filter'
import type { TvMazeShow } from '@/types/tvmaze'
import { getFilter } from './registry'

export function composeFilters(active: ActiveFilter[]): (show: TvMazeShow) => boolean {
  if (active.length === 0) return () => true

  const predicates = active.map((af) => {
    const def = getFilter<unknown>(af.id)
    return def.predicate(af.params)
  })

  // AND mode. TODO: switch `.every` -> `.some` for OR mode.
  return (show) => predicates.every((p) => p(show))
}
