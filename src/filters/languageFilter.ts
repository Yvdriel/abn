import type { FilterDefinition, LanguageFilterParams } from '@/types/filter'

const DEFAULT: LanguageFilterParams = { values: [] }

export const languageFilter: FilterDefinition<LanguageFilterParams> = {
  id: 'language',
  label: 'Languages',
  defaultParams: DEFAULT,
  isActive: (params) => params.values.length > 0,
  predicate: (params) => {
    if (params.values.length === 0) return () => true
    const wanted = new Set(params.values.map((v) => v.toLowerCase()))
    return (show) => show.language !== null && wanted.has(show.language.toLowerCase())
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
