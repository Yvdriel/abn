<script setup lang="ts">
import AppHeader from './AppHeader.vue'
import AppFooter from './AppFooter.vue'
</script>

<template>
  <div
    class="flex min-h-dvh flex-col bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100"
  >
    <a
      href="#main"
      class="sr-only focus:not-sr-only focus:fixed focus:left-2 focus:top-2 focus:z-50 focus:rounded-md focus:bg-emerald-600 focus:px-3 focus:py-1.5 focus:text-sm focus:font-medium focus:text-white"
      >Skip to main content</a
    >
    <AppHeader />
    <main id="main" tabindex="-1" class="mx-auto w-full max-w-7xl flex-1 outline-none">
      <slot />
    </main>
    <AppFooter />
  </div>
</template>
