<script setup lang="ts">
import { computed } from 'vue'
import { usePrefersReducedMotion } from '@/composables/usePrefersReducedMotion'

defineOptions({ name: 'AppSkeleton' })

interface Props {
  width?: string
  height?: string
  radius?: string
  lines?: number
}

const props = withDefaults(defineProps<Props>(), {
  width: '100%',
  height: '1rem',
  radius: '0.375rem',
  lines: 1,
})

const reduced = usePrefersReducedMotion()

const baseClass = computed(() =>
  reduced.value ? 'bg-slate-200 dark:bg-slate-800' : 'animate-pulse bg-slate-200 dark:bg-slate-800',
)

const style = computed(() => ({
  width: props.width,
  height: props.height,
  borderRadius: props.radius,
}))
</script>

<template>
  <div v-if="lines === 1" :class="baseClass" :style="style" aria-hidden="true" />
  <div v-else class="flex flex-col gap-2" aria-hidden="true">
    <div v-for="i in lines" :key="i" :class="baseClass" :style="style" />
  </div>
</template>
