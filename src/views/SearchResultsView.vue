<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useShowSearch } from '@/composables/useShowSearch'
import ShowCard from '@/components/ShowCard.vue'
import EmptyState from '@/components/EmptyState.vue'
import Skeleton from '@/components/Skeleton.vue'

const route = useRoute()
const query = computed(() => {
  const q = route.query.q
  return Array.isArray(q) ? (q[0] ?? '') : (q ?? '')
})

const { results, loading } = useShowSearch(query)

const heading = computed(() => (query.value ? `Results for “${query.value}”` : 'Search'))
</script>

<template>
  <div class="flex flex-col gap-4 px-4 py-6 sm:px-6">
    <h1 data-route-heading tabindex="-1" class="text-2xl font-bold tracking-tight outline-none">
      {{ heading }}
    </h1>
    <p v-if="!query" class="text-slate-500 dark:text-slate-400">
      Type a query in the header search to find shows.
    </p>
    <div
      v-else-if="loading && results.length === 0"
      class="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5"
    >
      <Skeleton v-for="i in 10" :key="i" :height="'260px'" />
    </div>
    <EmptyState
      v-else-if="results.length === 0"
      title="No results"
      description="Try a different search term, or check the spelling."
    />
    <ul
      v-else
      class="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5"
      :aria-label="`${results.length} results for ${query}`"
    >
      <li v-for="r in results" :key="r.show.id">
        <ShowCard :show="r.show" :query-highlight="query" />
      </li>
    </ul>
  </div>
</template>
