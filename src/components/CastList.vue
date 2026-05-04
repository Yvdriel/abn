<script setup lang="ts">
import { computed, ref } from 'vue'
import type { TvMazeCastMember } from '@/types/tvmaze'
import AppImage from './AppImage.vue'

interface Props {
  cast: TvMazeCastMember[]
}

const props = defineProps<Props>()

const INITIAL = 12
const expanded = ref(false)
const visible = computed(() => (expanded.value ? props.cast : props.cast.slice(0, INITIAL)))
const canExpand = computed(() => props.cast.length > INITIAL)
</script>

<template>
  <section v-if="cast.length > 0" class="flex flex-col gap-3" aria-labelledby="cast-heading">
    <h2 id="cast-heading" class="text-lg font-semibold">Cast</h2>
    <ul class="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
      <li
        v-for="(member, i) in visible"
        :key="`${member.person.id}-${i}`"
        class="flex flex-col gap-2"
      >
        <AppImage
          :src="member.person.image?.medium ?? null"
          :alt="member.person.name"
          aspect="poster"
        />
        <div class="flex flex-col">
          <span class="text-sm font-semibold">{{ member.person.name }}</span>
          <span class="text-xs text-slate-500 dark:text-slate-400"
            >as {{ member.character.name }}</span
          >
        </div>
      </li>
    </ul>
    <button
      v-if="canExpand"
      type="button"
      class="self-start text-sm font-medium text-emerald-700 hover:text-emerald-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500 dark:text-emerald-400"
      @click="expanded = !expanded"
    >
      {{ expanded ? 'Show less' : `Show all (${cast.length})` }}
    </button>
  </section>
</template>
