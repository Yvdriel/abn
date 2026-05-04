<script setup lang="ts">
import SearchInput from './SearchInput.vue'
</script>

<template>
  <header
    class="sticky top-0 z-20 border-b border-slate-200 bg-white/80 backdrop-blur dark:border-slate-800 dark:bg-slate-950/80"
  >
    <div class="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3 sm:px-6">
      <RouterLink
        :to="{ name: 'dashboard' }"
        class="flex items-center gap-2 text-base font-bold text-emerald-700 hover:text-emerald-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500 dark:text-emerald-400 dark:hover:text-emerald-300"
      >
        <span
          class="inline-flex h-7 w-7 items-center justify-center rounded-md bg-emerald-600 text-xs font-extrabold text-white"
          aria-hidden="true"
        >
          TV
        </span>
        <span>ABN AMRO Shows</span>
      </RouterLink>
      <div class="flex flex-1 justify-end">
        <SearchInput />
      </div>
    </div>
  </header>
</template>
