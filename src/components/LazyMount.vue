<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'

interface Props {
  estimatedHeight: string
  rootMargin?: string
}

const props = withDefaults(defineProps<Props>(), {
  rootMargin: '400px',
})

const root = ref<HTMLElement | null>(null)
const visible = ref(false)
let observer: IntersectionObserver | null = null

onMounted(() => {
  if (typeof IntersectionObserver === 'undefined' || !root.value) {
    visible.value = true
    return
  }
  observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          visible.value = true
          observer?.disconnect()
          observer = null
          break
        }
      }
    },
    { rootMargin: props.rootMargin },
  )
  observer.observe(root.value)
})

onBeforeUnmount(() => {
  observer?.disconnect()
  observer = null
})
</script>

<template>
  <div ref="root" :style="{ minHeight: visible ? undefined : estimatedHeight }">
    <slot v-if="visible" />
  </div>
</template>
