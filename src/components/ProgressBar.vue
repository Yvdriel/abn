<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  value: number
  label: string
  indeterminate?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  indeterminate: false,
})

const percent = computed(() => Math.round(Math.max(0, Math.min(1, props.value)) * 100))
</script>

<template>
  <div class="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
    <div
      class="h-1 w-32 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700"
      role="progressbar"
      :aria-label="label"
      :aria-valuenow="indeterminate ? undefined : percent"
      aria-valuemin="0"
      aria-valuemax="100"
    >
      <div
        v-if="!indeterminate"
        class="h-full bg-emerald-500 transition-[width] duration-300"
        :style="{ width: `${percent}%` }"
      />
      <div v-else class="h-full w-1/3 animate-pulse bg-emerald-500" />
    </div>
    <span aria-live="polite">{{ indeterminate ? label : `${label} ${percent}%` }}</span>
  </div>
</template>
