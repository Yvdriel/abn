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

// `anyVisible` short-circuits via `.some()` — much cheaper than `.filter().length`
// per genre on every paginator tick. When filters are inactive (the common case
// during streaming), it collapses to a single `totalShows > 0` check.
// Each `<GenreRow>` self-suppresses via `v-if` when its own filtered list is empty,
// so we don't need to compute the per-genre count here.
const anyVisible = computed(() => {
  if (!ui.hasActiveFilters) return shows.totalShows > 0
  const predicate = ui.combinedPredicate
  for (const key of shows.genreKeysSorted) {
    if (shows.showsByGenre(key).some(predicate)) return true
  }
  return false
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
    <div v-if="!anyVisible && shows.totalShows > 0" class="px-4 sm:px-6">
      <EmptyState
        title="No shows match your filters"
        description="Try clearing some filters or widening the rating range."
      />
    </div>
    <div v-else-if="showSkeleton" class="flex flex-col gap-6 px-4 py-6 sm:px-6">
      <Skeleton v-for="i in 3" :key="i" :height="'280px'" :width="'100%'" />
    </div>
    <template v-else>
      <GenreRow
        v-for="key in shows.genreKeysSorted"
        :key="key"
        :genre-key="key"
        :display-name="shows.state.genreDisplayName[key] ?? key"
      />
    </template>
  </div>
</template>
