import type { TvMazeShow } from './tvmaze'

export type FilterId = 'genre' | 'minRating' | 'language'

export interface FilterDefinition<P> {
  id: FilterId
  label: string
  defaultParams: P
  predicate: (params: P) => (show: TvMazeShow) => boolean
  isActive: (params: P) => boolean
  serialize: (params: P) => string | undefined
  deserialize: (raw: string | undefined) => P
}

export interface ActiveFilter<P = unknown> {
  id: FilterId
  params: P
}

export interface GenreFilterParams {
  values: string[]
}

export interface MinRatingFilterParams {
  min: number
}

export interface LanguageFilterParams {
  values: string[]
}
