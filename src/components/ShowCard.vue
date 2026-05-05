<script setup lang="ts">
import { computed, ref } from 'vue'
import { RouterLink } from 'vue-router'
import type { TvMazeShow } from '@/types/tvmaze'
import AppImage from './AppImage.vue'
import Rating from './Rating.vue'
import { splitForHighlight } from '@/utils/highlight'

interface Props {
  show: TvMazeShow
  queryHighlight?: string
  tabbable?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  queryHighlight: '',
  tabbable: true,
})

const linkRef = ref<InstanceType<typeof RouterLink> | null>(null)

defineExpose({
  focus(): void {
    const inst = linkRef.value as { $el?: HTMLElement } | null
    inst?.$el?.focus?.()
  },
})

const displayName = computed(() => props.show.name || 'Untitled')
const segments = computed(() =>
  props.queryHighlight ? splitForHighlight(displayName.value, props.queryHighlight) : null,
)
const topGenres = computed(() => props.show.genres.slice(0, 2))
const posterSrc = computed(() => props.show.image?.medium ?? null)
</script>

<template>
  <RouterLink
    ref="linkRef"
    :to="{ name: 'show', params: { id: show.id } }"
    :tabindex="tabbable ? 0 : -1"
    class="group flex w-40 shrink-0 flex-col gap-2 rounded-md p-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500 sm:w-44"
    :aria-label="`Open details for ${displayName}`"
  >
    <AppImage :src="posterSrc" :alt="`${displayName} poster`" />
    <div class="flex flex-col gap-1">
      <h3
        class="line-clamp-2 text-sm font-semibold text-slate-900 group-hover:text-emerald-700 dark:text-slate-100 dark:group-hover:text-emerald-300"
      >
        <template v-if="segments">
          <template v-for="(seg, i) in segments" :key="i">
            <mark
              v-if="seg.match"
              class="rounded bg-emerald-200 text-emerald-900 dark:bg-emerald-900/60 dark:text-emerald-100"
              >{{ seg.text }}</mark
            >
            <template v-else>{{ seg.text }}</template>
          </template>
        </template>
        <template v-else>{{ displayName }}</template>
      </h3>
      <div class="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
        <Rating :value="show.rating.average" />
        <div class="flex flex-wrap justify-end gap-1">
          <span
            v-for="g in topGenres"
            :key="g"
            class="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-slate-600 dark:bg-slate-800 dark:text-slate-300"
          >
            {{ g }}
          </span>
        </div>
      </div>
    </div>
  </RouterLink>
</template>
