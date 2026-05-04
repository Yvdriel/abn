<script setup lang="ts">
import { computed } from 'vue'
import { useUiStore } from '@/stores/ui'
import { useShowsStore } from '@/stores/shows'
import type { GenreFilterParams, LanguageFilterParams, MinRatingFilterParams } from '@/types/filter'

const ui = useUiStore()
const shows = useShowsStore()

const genreParams = computed<GenreFilterParams>(
  () => (ui.filterById('genre')?.params as GenreFilterParams) ?? { values: [] },
)
const languageParams = computed<LanguageFilterParams>(
  () => (ui.filterById('language')?.params as LanguageFilterParams) ?? { values: [] },
)
const minRatingParams = computed<MinRatingFilterParams>(
  () => (ui.filterById('minRating')?.params as MinRatingFilterParams) ?? { min: 0 },
)

const allGenres = computed(() => {
  const keys = shows.genreKeysSorted
  return keys.map((k) => ({ key: k, label: shows.state.genreDisplayName[k] ?? k }))
})

const allLanguages = computed(() => shows.languages)

function toggleGenre(key: string): void {
  const next = new Set(genreParams.value.values)
  if (next.has(key)) next.delete(key)
  else next.add(key)
  ui.setFilter<GenreFilterParams>('genre', { values: Array.from(next) })
}

function toggleLanguage(lang: string): void {
  const next = new Set(languageParams.value.values.map((v) => v.toLowerCase()))
  const lower = lang.toLowerCase()
  if (next.has(lower)) next.delete(lower)
  else next.add(lower)
  ui.setFilter<LanguageFilterParams>('language', { values: Array.from(next) })
}

function setMinRating(value: number): void {
  ui.setFilter<MinRatingFilterParams>('minRating', { min: value })
}
</script>

<template>
  <div
    class="flex flex-wrap items-center gap-3 border-b border-slate-200 bg-white px-4 py-3 text-sm dark:border-slate-800 dark:bg-slate-950 sm:px-6"
  >
    <div class="flex items-center gap-2">
      <label for="min-rating" class="text-slate-600 dark:text-slate-300">Min rating</label>
      <input
        id="min-rating"
        type="range"
        min="0"
        max="10"
        step="0.5"
        :value="minRatingParams.min"
        class="w-32 accent-emerald-600"
        @input="(e) => setMinRating(Number((e.target as HTMLInputElement).value))"
      />
      <span class="w-8 text-right tabular-nums">
        {{ minRatingParams.min === 0 ? '—' : minRatingParams.min.toFixed(1) }}
      </span>
    </div>
    <details class="relative">
      <summary
        class="cursor-pointer rounded-md border border-slate-300 bg-white px-3 py-1.5 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800"
      >
        Genres
        <span
          v-if="genreParams.values.length > 0"
          class="ml-1 text-emerald-700 dark:text-emerald-400"
        >
          ({{ genreParams.values.length }})
        </span>
      </summary>
      <div
        class="absolute left-0 top-full z-10 mt-1 max-h-72 w-56 overflow-auto rounded-md border border-slate-200 bg-white p-2 shadow-lg dark:border-slate-800 dark:bg-slate-900"
      >
        <label
          v-for="g in allGenres"
          :key="g.key"
          class="flex cursor-pointer items-center gap-2 rounded px-2 py-1 hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          <input
            type="checkbox"
            :checked="genreParams.values.includes(g.key)"
            class="accent-emerald-600"
            @change="toggleGenre(g.key)"
          />
          <span>{{ g.label }}</span>
        </label>
      </div>
    </details>
    <details v-if="allLanguages.length > 0" class="relative">
      <summary
        class="cursor-pointer rounded-md border border-slate-300 bg-white px-3 py-1.5 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800"
      >
        Languages
        <span
          v-if="languageParams.values.length > 0"
          class="ml-1 text-emerald-700 dark:text-emerald-400"
        >
          ({{ languageParams.values.length }})
        </span>
      </summary>
      <div
        class="absolute left-0 top-full z-10 mt-1 max-h-72 w-48 overflow-auto rounded-md border border-slate-200 bg-white p-2 shadow-lg dark:border-slate-800 dark:bg-slate-900"
      >
        <label
          v-for="l in allLanguages"
          :key="l"
          class="flex cursor-pointer items-center gap-2 rounded px-2 py-1 hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          <input
            type="checkbox"
            :checked="languageParams.values.map((v) => v.toLowerCase()).includes(l.toLowerCase())"
            class="accent-emerald-600"
            @change="toggleLanguage(l)"
          />
          <span>{{ l }}</span>
        </label>
      </div>
    </details>
    <button
      v-if="ui.hasActiveFilters"
      type="button"
      class="ml-auto text-xs font-medium text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
      @click="ui.clearAllFilters()"
    >
      Clear all
    </button>
  </div>
</template>
