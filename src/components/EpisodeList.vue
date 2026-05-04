<script setup lang="ts">
import { computed, ref } from 'vue'
import type { TvMazeEpisode } from '@/types/tvmaze'
import { formatDate } from '@/utils/formatDate'

interface Props {
  episodes: TvMazeEpisode[]
}

const props = defineProps<Props>()

const seasons = computed(() => {
  const map = new Map<number, TvMazeEpisode[]>()
  for (const ep of props.episodes) {
    const s = ep.season ?? 0
    if (!map.has(s)) map.set(s, [])
    map.get(s)!.push(ep)
  }
  return Array.from(map.entries()).sort((a, b) => a[0] - b[0])
})

const expanded = ref(new Set<number>())

function toggle(season: number): void {
  if (expanded.value.has(season)) expanded.value.delete(season)
  else expanded.value.add(season)
  expanded.value = new Set(expanded.value)
}

function isExpanded(season: number, index: number): boolean {
  return expanded.value.has(season) || index === 0
}

function pad(n: number | null): string {
  if (n === null) return '?'
  return String(n).padStart(2, '0')
}
</script>

<template>
  <section
    v-if="episodes.length > 0"
    class="flex flex-col gap-3"
    aria-labelledby="episodes-heading"
  >
    <h2 id="episodes-heading" class="text-lg font-semibold">Episodes</h2>
    <div
      v-for="([season, list], i) in seasons"
      :key="season"
      class="rounded-md border border-slate-200 dark:border-slate-800"
    >
      <button
        type="button"
        class="flex w-full items-center justify-between px-4 py-3 text-left font-medium hover:bg-slate-50 dark:hover:bg-slate-900"
        :aria-expanded="isExpanded(season, i)"
        @click="toggle(season)"
      >
        <span>Season {{ season }}</span>
        <span class="text-sm text-slate-500 dark:text-slate-400">{{ list.length }} episodes</span>
      </button>
      <ul v-if="isExpanded(season, i)" class="divide-y divide-slate-100 dark:divide-slate-800">
        <li
          v-for="ep in list"
          :key="ep.id"
          class="flex flex-wrap items-baseline gap-x-3 gap-y-1 px-4 py-2 text-sm"
        >
          <span class="font-mono text-xs text-slate-500 dark:text-slate-400">
            S{{ pad(ep.season) }}E{{ pad(ep.number) }}
          </span>
          <span class="font-medium">{{ ep.name }}</span>
          <span v-if="ep.airdate" class="ml-auto text-xs text-slate-500 dark:text-slate-400">
            {{ formatDate(ep.airdate) }}
          </span>
        </li>
      </ul>
    </div>
  </section>
</template>
