<script setup lang="ts">
import { onMounted } from 'vue'
import AppShell from '@/components/AppShell.vue'
import { useShowsStore } from '@/stores/shows'
import { useUrlState } from '@/composables/useUrlState'
import { useFocusOnRouteChange } from '@/composables/useFocusOnRouteChange'

const store = useShowsStore()

useUrlState()
useFocusOnRouteChange()

onMounted(async () => {
  try {
    await store.fetchFirstPage()
  } catch {
    // error surfaced via footer/paginator state
  }
  void store.startBackgroundPaginator()
})
</script>

<template>
  <AppShell>
    <RouterView />
  </AppShell>
</template>
