<script setup lang="ts">
import { computed, ref } from 'vue'
import { useShowsStore } from '@/stores/shows'
import { useVirtualList } from '@/composables/useVirtualList'
import LazyMount from './LazyMount.vue'
import ShowCard from './ShowCard.vue'

interface Props {
  genreKey: string
  displayName: string
}

const props = defineProps<Props>()
const store = useShowsStore()

const ITEM_WIDTH = 176 // matches w-44 (sm) + gap accounted via gap prop
const GAP = 16
const ROW_HEIGHT = 320

const containerRef = ref<HTMLElement | null>(null)
const shows = computed(() => store.showsByGenre(props.genreKey))

const { windowItems, contentSize, offset } = useVirtualList({
  items: shows,
  itemSize: ITEM_WIDTH,
  containerRef,
  axis: 'x',
  buffer: 3,
  gap: GAP,
})

const headingId = computed(() => `row-heading-${props.genreKey.replace(/\s+/g, '-')}`)
</script>

<template>
  <LazyMount :estimated-height="`${ROW_HEIGHT}px`">
    <section class="flex flex-col gap-3 py-4" role="region" :aria-labelledby="headingId">
      <h2
        :id="headingId"
        class="px-4 text-lg font-semibold text-slate-900 dark:text-slate-100 sm:px-6"
      >
        {{ displayName }}
        <span class="text-sm font-normal text-slate-500 dark:text-slate-400">
          ({{ shows.length }})
        </span>
      </h2>
      <div
        ref="containerRef"
        class="overflow-x-auto overflow-y-hidden px-4 pb-2 [scrollbar-width:thin] sm:px-6"
        tabindex="0"
        :aria-label="`${displayName} shows, scroll horizontally`"
      >
        <div
          class="relative"
          :style="{ width: `${contentSize}px`, height: `${ROW_HEIGHT - 80}px` }"
        >
          <div class="absolute top-0 flex gap-4" :style="{ transform: `translateX(${offset}px)` }">
            <ShowCard v-for="entry in windowItems" :key="entry.item.id" :show="entry.item" />
          </div>
        </div>
      </div>
    </section>
  </LazyMount>
</template>
