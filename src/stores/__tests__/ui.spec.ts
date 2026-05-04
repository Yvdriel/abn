import { beforeEach, describe, expect, it } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useUiStore } from '../ui'
import { makeShow } from '@/__tests__/fixtures'

beforeEach(() => {
  setActivePinia(createPinia())
})

describe('useUiStore.setFilter / clearFilter', () => {
  it('upserts a filter', () => {
    const store = useUiStore()
    store.setFilter('genre', { values: ['drama'] })
    store.setFilter('genre', { values: ['comedy'] })
    expect(store.state.activeFilters).toHaveLength(1)
    expect(store.filterById('genre')?.params).toEqual({ values: ['comedy'] })
  })

  it('inactive params remove the filter', () => {
    const store = useUiStore()
    store.setFilter('genre', { values: ['drama'] })
    store.setFilter('genre', { values: [] })
    expect(store.state.activeFilters).toHaveLength(0)
  })

  it('clearFilter removes by id', () => {
    const store = useUiStore()
    store.setFilter('genre', { values: ['drama'] })
    store.setFilter('minRating', { min: 7 })
    store.clearFilter('genre')
    expect(store.state.activeFilters.map((f) => f.id)).toEqual(['minRating'])
  })
})

describe('useUiStore.hydrateFromUrl', () => {
  it('parses q, genre, minRating, language', () => {
    const store = useUiStore()
    store.hydrateFromUrl({
      q: 'crown',
      genre: 'drama,history',
      minRating: '8',
      language: 'english',
    })
    expect(store.state.searchQuery).toBe('crown')
    expect(store.filterById('genre')?.params).toEqual({ values: ['drama', 'history'] })
    expect(store.filterById('minRating')?.params).toEqual({ min: 8 })
    expect(store.filterById('language')?.params).toEqual({ values: ['english'] })
  })

  it('drops inactive params', () => {
    const store = useUiStore()
    store.hydrateFromUrl({ q: '', minRating: '0' })
    expect(store.state.searchQuery).toBe('')
    expect(store.state.activeFilters).toHaveLength(0)
  })
})

describe('useUiStore.combinedPredicate', () => {
  it('AND-composes active filters', () => {
    const store = useUiStore()
    store.setFilter('genre', { values: ['drama'] })
    store.setFilter('minRating', { min: 8 })
    const pred = store.combinedPredicate
    expect(pred(makeShow({ genres: ['Drama'], rating: { average: 9 } }))).toBe(true)
    expect(pred(makeShow({ genres: ['Drama'], rating: { average: 7 } }))).toBe(false)
    expect(pred(makeShow({ genres: ['Comedy'], rating: { average: 9 } }))).toBe(false)
  })
})

describe('useUiStore.serializeToQuery', () => {
  it('round-trips with hydrateFromUrl', () => {
    const a = useUiStore()
    a.setSearchQuery('crown')
    a.setFilter('genre', { values: ['drama', 'history'] })
    a.setFilter('minRating', { min: 8 })
    const query = a.serializeToQuery()

    setActivePinia(createPinia())
    const b = useUiStore()
    b.hydrateFromUrl(query)
    expect(b.state.searchQuery).toBe('crown')
    expect(b.filterById('genre')?.params).toEqual({ values: ['drama', 'history'] })
    expect(b.filterById('minRating')?.params).toEqual({ min: 8 })
  })
})
