<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useShowsStore } from '@/stores/shows'
import { useUiStore } from '@/stores/ui'
import { useVirtualList } from '@/composables/useVirtualList'
import { useSingleRowKeyboardNav } from '@/composables/useKeyboardGrid'
import LazyMount from './LazyMount.vue'
import ShowCard from './ShowCard.vue'

interface Props {
  genreKey: string
  displayName: string
}

const props = defineProps<Props>()
const store = useShowsStore()
const ui = useUiStore()
const router = useRouter()

const ITEM_WIDTH = 176 // matches w-44 (sm) + gap accounted via gap prop
const GAP = 16
const ROW_HEIGHT = 320

const containerRef = ref<HTMLElement | null>(null)
const allShows = computed(() => store.showsByGenre(props.genreKey))
// Per-row filtering: depends only on this row's bucket and the active predicate.
// Untouched rows during streaming don't recompute because their `sortedByGenre[key]`
// reference is unchanged AND `ui.combinedPredicate` is stable while no filters change.
const shows = computed(() => {
  if (!ui.hasActiveFilters) return allShows.value
  return allShows.value.filter(ui.combinedPredicate)
})

const { windowItems, contentSize, offset, scrollTo } = useVirtualList({
  items: shows,
  itemSize: ITEM_WIDTH,
  containerRef,
  axis: 'x',
  buffer: 3,
  gap: GAP,
})

const headingId = computed(() => `row-heading-${props.genreKey.replace(/\s+/g, '-')}`)

// Map of card index -> mounted ShowCard instance, populated via :ref callbacks
// in the template. Only window items are mounted, so this is sparse.
type ShowCardExposed = { focus: () => void }
const cardRefs = new Map<number, ShowCardExposed>()
function setCardRef(index: number, instance: unknown): void {
  if (instance) cardRefs.set(index, instance as ShowCardExposed)
  else cardRefs.delete(index)
}

const { active, onKeydown } = useSingleRowKeyboardNav({
  itemCount: computed(() => shows.value.length),
  onActivate: (col) => {
    const show = shows.value[col]
    if (show) void router.push({ name: 'show', params: { id: show.id } })
  },
})

// Track whether the row currently owns focus, to avoid stealing focus from
// a user clicking elsewhere while keyboard nav is bookkeeping internally.
const rowHasFocus = ref(false)
function onFocusIn(): void {
  rowHasFocus.value = true
}
function onFocusOut(event: FocusEvent): void {
  const next = event.relatedTarget as Node | null
  if (!containerRef.value || !next || !containerRef.value.contains(next)) {
    rowHasFocus.value = false
  }
}

// When `active` changes via keyboard, scroll the active card into view and
// move DOM focus to it. Only when the row currently owns focus.
watch(active, async (col) => {
  if (!rowHasFocus.value) return
  scrollTo(col)
  await nextTick()
  cardRefs.get(col)?.focus()
})
</script>

<template>
  <LazyMount v-if="shows.length > 0" :estimated-height="`${ROW_HEIGHT}px`">
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
        :aria-label="`${displayName} shows, use arrow keys to navigate`"
        @keydown="onKeydown"
        @focusin="onFocusIn"
        @focusout="onFocusOut"
      >
        <div
          class="relative"
          :style="{ width: `${contentSize}px`, height: `${ROW_HEIGHT - 80}px` }"
        >
          <div class="absolute top-0 flex gap-4" :style="{ transform: `translateX(${offset}px)` }">
            <ShowCard
              v-for="entry in windowItems"
              :key="entry.item.id"
              :ref="(el) => setCardRef(entry.index, el)"
              :show="entry.item"
              :tabbable="entry.index === active"
            />
          </div>
        </div>
      </div>
    </section>
  </LazyMount>
</template>
