import { computed, reactive } from 'vue'
import { defineStore } from 'pinia'
import type { ActiveFilter, FilterId } from '@/types/filter'
import type { UiState } from '@/types/ui'
import { FILTER_REGISTRY, getFilter } from '@/filters/registry'
import { composeFilters } from '@/filters/compose'

type ParsedQuery = Record<string, string | string[] | null | undefined>

export const useUiStore = defineStore('ui', () => {
  const state = reactive<UiState>({
    searchQuery: '',
    activeFilters: [],
  })

  function setSearchQuery(q: string): void {
    state.searchQuery = q
  }

  function setFilter<P>(id: FilterId, params: P): void {
    const def = getFilter<P>(id)
    if (!def.isActive(params)) {
      clearFilter(id)
      return
    }
    const idx = state.activeFilters.findIndex((f) => f.id === id)
    if (idx >= 0) {
      state.activeFilters[idx] = { id, params: params as unknown }
    } else {
      state.activeFilters.push({ id, params: params as unknown })
    }
  }

  function clearFilter(id: FilterId): void {
    state.activeFilters = state.activeFilters.filter((f) => f.id !== id)
  }

  function clearAllFilters(): void {
    state.activeFilters = []
  }

  function hydrateFromUrl(query: ParsedQuery): void {
    const q = query.q
    state.searchQuery = typeof q === 'string' ? q : ''

    const next: ActiveFilter[] = []
    for (const def of FILTER_REGISTRY) {
      const raw = query[def.id]
      const value = Array.isArray(raw) ? (raw[0] ?? undefined) : (raw ?? undefined)
      const params = def.deserialize(value ?? undefined)
      if (def.isActive(params)) {
        next.push({ id: def.id, params: params as unknown })
      }
    }
    state.activeFilters = next
  }

  function serializeToQuery(): Record<string, string> {
    const out: Record<string, string> = {}
    if (state.searchQuery.length > 0) out.q = state.searchQuery
    for (const af of state.activeFilters) {
      const def = getFilter(af.id)
      const serialized = def.serialize(af.params)
      if (serialized !== undefined) out[af.id] = serialized
    }
    return out
  }

  const hasActiveFilters = computed(() => state.activeFilters.length > 0)

  function filterById(id: FilterId): ActiveFilter | undefined {
    return state.activeFilters.find((f) => f.id === id)
  }

  const combinedPredicate = computed(() => composeFilters(state.activeFilters))

  return {
    state,
    setSearchQuery,
    setFilter,
    clearFilter,
    clearAllFilters,
    hydrateFromUrl,
    serializeToQuery,
    hasActiveFilters,
    filterById,
    combinedPredicate,
  }
})

export type UiStore = ReturnType<typeof useUiStore>
