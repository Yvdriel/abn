<script setup lang="ts">
interface Props {
  message: string
  onRetry?: () => void
}

const props = defineProps<Props>()

function handleRetry(): void {
  props.onRetry?.()
}
</script>

<template>
  <div
    class="flex flex-col items-start gap-3 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-900 dark:border-red-900/40 dark:bg-red-950/40 dark:text-red-100"
    role="alert"
  >
    <p class="font-medium">{{ message }}</p>
    <button
      v-if="onRetry"
      type="button"
      class="rounded-md bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-700"
      @click="handleRetry"
    >
      Try again
    </button>
  </div>
</template>
