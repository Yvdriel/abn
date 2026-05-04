<script setup lang="ts">
import BackLink from '@/components/BackLink.vue'
</script>

<template>
  <section class="flex flex-col items-start gap-4 px-4 py-12 sm:px-6">
    <h1 data-route-heading tabindex="-1" class="text-3xl font-bold tracking-tight outline-none">
      Not found
    </h1>
    <p class="text-slate-600 dark:text-slate-300">The page you’re looking for doesn’t exist.</p>
    <BackLink :to="{ name: 'dashboard' }" label="Back to dashboard" />
  </section>
</template>
