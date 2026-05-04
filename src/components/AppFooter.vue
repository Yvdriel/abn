<script setup lang="ts">
import { computed } from 'vue'
import { useShowsStore } from '@/stores/shows'
import ProgressBar from './ProgressBar.vue'

const store = useShowsStore()

const label = computed(() => {
  switch (store.state.paginator.status) {
    case 'streaming':
      return 'Loading shows…'
    case 'done':
      return `Loaded ${store.totalShows} shows`
    case 'paused':
      return 'Paused'
    case 'error':
      return store.state.paginator.lastError ?? 'Failed to load all pages'
    case 'idle':
    default:
      return 'Ready'
  }
})

const showProgress = computed(
  () => store.state.paginator.status === 'streaming' || store.state.paginator.status === 'done',
)
</script>

<template>
  <footer
    class="mt-auto border-t border-slate-200 bg-white py-3 text-xs text-slate-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400"
  >
    <div class="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 sm:px-6">
      <ProgressBar
        v-if="showProgress"
        :value="store.progressFraction"
        :label="label"
        :indeterminate="store.state.paginator.endPage === null"
      />
      <span v-else>{{ label }}</span>
      <span>
        Data:
        <a
          href="https://www.tvmaze.com"
          target="_blank"
          rel="noopener noreferrer"
          class="underline hover:text-slate-700 dark:hover:text-slate-200"
          >TVMaze</a
        >
      </span>
    </div>
  </footer>
</template>
