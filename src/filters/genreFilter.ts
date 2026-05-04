import type { FilterDefinition, GenreFilterParams } from '@/types/filter'

const DEFAULT: GenreFilterParams = { values: [] }

export const genreFilter: FilterDefinition<GenreFilterParams> = {
  id: 'genre',
  label: 'Genres',
  defaultParams: DEFAULT,
  isActive: (params) => params.values.length > 0,
  predicate: (params) => {
    if (params.values.length === 0) return () => true
    const wanted = new Set(params.values.map((v) => v.toLowerCase()))
    return (show) => show.genres.some((g) => wanted.has(g.toLowerCase()))
  },
  serialize: (params) => {
    if (params.values.length === 0) return undefined
    return params.values.map((v) => v.toLowerCase()).join(',')
  },
  deserialize: (raw) => {
    if (!raw) return { values: [] }
    return {
      values: raw
        .split(',')
        .map((v) => v.trim())
        .filter((v) => v.length > 0),
    }
  },
}
