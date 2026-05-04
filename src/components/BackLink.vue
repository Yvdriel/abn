<script setup lang="ts">
import type { RouteLocationRaw } from 'vue-router'

interface Props {
  to: RouteLocationRaw
  label?: string
}

withDefaults(defineProps<Props>(), {
  label: 'Back',
})
</script>

<template>
  <RouterLink
    :to="to"
    class="inline-flex items-center gap-1 text-sm font-medium text-slate-600 hover:text-slate-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500 dark:text-slate-300 dark:hover:text-white"
  >
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      class="h-4 w-4"
      aria-hidden="true"
    >
      <path stroke-linecap="round" stroke-linejoin="round" d="M15 18l-6-6 6-6" />
    </svg>
    {{ label }}
  </RouterLink>
</template>
