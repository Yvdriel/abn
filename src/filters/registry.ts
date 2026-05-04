import type { FilterDefinition, FilterId } from '@/types/filter'
import { genreFilter } from './genreFilter'
import { minRatingFilter } from './minRatingFilter'
import { languageFilter } from './languageFilter'

export const FILTER_REGISTRY: ReadonlyArray<FilterDefinition<unknown>> = [
  genreFilter as unknown as FilterDefinition<unknown>,
  minRatingFilter as unknown as FilterDefinition<unknown>,
  languageFilter as unknown as FilterDefinition<unknown>,
]

const BY_ID: Record<FilterId, FilterDefinition<unknown>> = {
  genre: genreFilter as unknown as FilterDefinition<unknown>,
  minRating: minRatingFilter as unknown as FilterDefinition<unknown>,
  language: languageFilter as unknown as FilterDefinition<unknown>,
}

export function getFilter<P>(id: FilterId): FilterDefinition<P> {
  return BY_ID[id] as unknown as FilterDefinition<P>
}
