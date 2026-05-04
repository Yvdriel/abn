<script setup lang="ts">
import { computed } from 'vue'
import { useShowsStore } from '@/stores/shows'
import { useUiStore } from '@/stores/ui'
import GenreRow from '@/components/GenreRow.vue'
import FilterBar from '@/components/FilterBar.vue'
import EmptyState from '@/components/EmptyState.vue'
import Skeleton from '@/components/Skeleton.vue'

const shows = useShowsStore()
const ui = useUiStore()

interface FilteredGenre {
  key: string
  displayName: string
  count: number
}

const filteredGenres = computed<FilteredGenre[]>(() => {
  const hasFilters = ui.hasActiveFilters
  const predicate = hasFilters ? ui.combinedPredicate : null
  return shows.genreKeysSorted
    .map((key) => {
      const all = shows.showsByGenre(key)
      // Fast path: when no filters are active, avoid an O(N) iteration per
      // genre on every paginator tick — just check length.
      const count = predicate ? all.filter(predicate).length : all.length
      return {
        key,
        displayName: shows.state.genreDisplayName[key] ?? key,
        count,
      }
    })
    .filter((g) => g.count > 0)
})

const showSkeleton = computed(() => shows.totalShows === 0 && !shows.isPaginating)
</script>

<template>
  <div class="flex flex-col">
    <h1
      data-route-heading
      tabindex="-1"
      class="px-4 pb-2 pt-6 text-2xl font-bold tracking-tight outline-none sm:px-6"
    >
      Browse shows
    </h1>
    <FilterBar />
    <div v-if="filteredGenres.length === 0 && shows.totalShows > 0" class="px-4 sm:px-6">
      <EmptyState
        title="No shows match your filters"
        description="Try clearing some filters or widening the rating range."
      />
    </div>
    <div v-else-if="showSkeleton" class="flex flex-col gap-6 px-4 py-6 sm:px-6">
      <Skeleton v-for="i in 3" :key="i" :height="'280px'" :width="'100%'" />
    </div>
    <GenreRow
      v-for="g in filteredGenres"
      :key="g.key"
      :genre-key="g.key"
      :display-name="g.displayName"
    />
  </div>
</template>
