<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useUiStore } from '@/stores/ui'
import { useDebouncedRef } from '@/composables/useDebouncedRef'
import { watch } from 'vue'

const ui = useUiStore()
const router = useRouter()
const inputRef = ref<HTMLInputElement | null>(null)

const local = ref(ui.state.searchQuery)
const debounced = useDebouncedRef(local, 300)

watch(debounced, (value) => {
  if (value !== ui.state.searchQuery) ui.setSearchQuery(value)
})

watch(
  () => ui.state.searchQuery,
  (value) => {
    if (value !== local.value) local.value = value
  },
)

const hasValue = computed(() => local.value.length > 0)

function onEnter(): void {
  void router.push({ name: 'search', query: local.value ? { q: local.value } : {} })
}

function onEscape(): void {
  local.value = ''
  ui.setSearchQuery('')
  inputRef.value?.blur()
}

function clear(): void {
  local.value = ''
  ui.setSearchQuery('')
  inputRef.value?.focus()
}
</script>

<template>
  <form class="relative flex w-full max-w-md items-center" role="search" @submit.prevent="onEnter">
    <label class="sr-only" for="show-search">Search shows</label>
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      class="pointer-events-none absolute left-3 h-4 w-4 text-slate-400"
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="7" />
      <path stroke-linecap="round" d="M21 21l-4.3-4.3" />
    </svg>
    <input
      id="show-search"
      ref="inputRef"
      v-model="local"
      type="search"
      role="searchbox"
      autocomplete="off"
      placeholder="Search shows…"
      aria-label="Search shows"
      class="w-full rounded-full border border-slate-300 bg-white py-2 pl-9 pr-9 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
      @keydown.enter.prevent="onEnter"
      @keydown.escape.prevent="onEscape"
    />
    <button
      v-if="hasValue"
      type="button"
      aria-label="Clear search"
      class="absolute right-2 inline-flex h-7 w-7 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500 dark:hover:bg-slate-800 dark:hover:text-white"
      @click="clear"
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        class="h-4 w-4"
        aria-hidden="true"
      >
        <path stroke-linecap="round" d="M6 6l12 12M18 6L6 18" />
      </svg>
    </button>
  </form>
</template>
