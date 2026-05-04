<script setup lang="ts">
interface Props {
  title: string
  description?: string
}

defineProps<Props>()
</script>

<template>
  <div class="flex flex-col items-center justify-center gap-2 py-12 text-center">
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.5"
      class="h-10 w-10 text-slate-400"
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="7" />
      <path stroke-linecap="round" d="M21 21l-4.3-4.3" />
    </svg>
    <h2 class="text-lg font-semibold text-slate-700 dark:text-slate-200">{{ title }}</h2>
    <p v-if="description" class="max-w-md text-sm text-slate-500 dark:text-slate-400">
      {{ description }}
    </p>
  </div>
</template>
