<script setup lang="ts">
import { computed } from 'vue'

defineOptions({ name: 'ShowRating' })

interface Props {
  value: number | null
}

const props = defineProps<Props>()

const display = computed(() =>
  props.value === null || Number.isNaN(props.value) ? '—' : props.value.toFixed(1),
)

const ariaLabel = computed(() =>
  props.value === null ? 'No rating available' : `Rating: ${props.value.toFixed(1)} out of 10`,
)
</script>

<template>
  <span
    class="inline-flex items-center gap-1 text-sm font-medium text-slate-700 dark:text-slate-200"
    :aria-label="ariaLabel"
  >
    <svg viewBox="0 0 24 24" fill="currentColor" class="h-4 w-4 text-amber-500" aria-hidden="true">
      <path
        d="M12 2.75l2.93 5.94 6.57.96-4.75 4.63 1.12 6.54L12 17.77 6.13 20.82l1.12-6.54L2.5 9.65l6.57-.96L12 2.75z"
      />
    </svg>
    <span>{{ display }}</span>
  </span>
</template>
