import type { FilterDefinition, MinRatingFilterParams } from '@/types/filter'

const DEFAULT: MinRatingFilterParams = { min: 0 }

export const minRatingFilter: FilterDefinition<MinRatingFilterParams> = {
  id: 'minRating',
  label: 'Minimum rating',
  defaultParams: DEFAULT,
  isActive: (params) => params.min > 0,
  predicate: (params) => {
    if (params.min <= 0) return () => true
    return (show) => (show.rating.average ?? 0) >= params.min
  },
  serialize: (params) => {
    if (params.min <= 0) return undefined
    return String(params.min)
  },
  deserialize: (raw) => {
    if (!raw) return { min: 0 }
    const n = Number(raw)
    if (!Number.isFinite(n) || n < 0) return { min: 0 }
    return { min: Math.min(n, 10) }
  },
}
