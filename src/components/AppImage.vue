<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  src: string | null
  alt: string
  aspect?: 'poster' | 'square' | 'video'
  sizes?: string
}

const props = withDefaults(defineProps<Props>(), {
  aspect: 'poster',
  sizes: undefined,
})

const aspectClass = computed(() => {
  switch (props.aspect) {
    case 'square':
      return 'aspect-square'
    case 'video':
      return 'aspect-video'
    case 'poster':
    default:
      return 'aspect-[2/3]'
  }
})
</script>

<template>
  <div :class="['relative overflow-hidden rounded-md bg-slate-200 dark:bg-slate-800', aspectClass]">
    <img
      v-if="src"
      :src="src"
      :alt="alt"
      :sizes="sizes"
      loading="lazy"
      decoding="async"
      class="h-full w-full object-cover"
    />
    <div
      v-else
      class="flex h-full w-full items-center justify-center text-slate-500 dark:text-slate-400"
      role="img"
      :aria-label="alt"
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="1.5"
        class="h-10 w-10 opacity-50"
        aria-hidden="true"
      >
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <circle cx="9" cy="9" r="1.5" fill="currentColor" />
        <path d="M21 16l-5-5-9 9" />
      </svg>
    </div>
  </div>
</template>
