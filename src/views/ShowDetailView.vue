<script setup lang="ts">
import { computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useShowsStore } from '@/stores/shows'
import AppImage from '@/components/AppImage.vue'
import Rating from '@/components/Rating.vue'
import BackLink from '@/components/BackLink.vue'
import CastList from '@/components/CastList.vue'
import EpisodeList from '@/components/EpisodeList.vue'
import Skeleton from '@/components/Skeleton.vue'
import ErrorState from '@/components/ErrorState.vue'
import { stripHtml } from '@/utils/stripHtml'
import { formatYear } from '@/utils/formatDate'

const route = useRoute()
const store = useShowsStore()

const id = computed(() => Number(route.params.id))
const show = computed(() => store.state.byId[id.value] ?? null)
const meta = computed(() => store.state.detailMeta[id.value])
const error = computed(() => meta.value?.error ?? null)

const summary = computed(() => stripHtml(show.value?.summary ?? ''))
const yearRange = computed(() => {
  const s = show.value
  if (!s) return ''
  const start = formatYear(s.premiered)
  if (s.status === 'Ended' && s.ended) {
    const end = formatYear(s.ended)
    return start && end ? `${start} – ${end}` : start || end
  }
  return start ? `${start}–` : ''
})

async function load(): Promise<void> {
  if (!Number.isFinite(id.value)) return
  try {
    await store.fetchShowDetail(id.value)
  } catch {
    // displayed via error state
  }
}

watch(id, () => load(), { immediate: true })

function retry(): void {
  void load()
}
</script>

<template>
  <article class="flex flex-col gap-6 px-4 py-6 sm:px-6">
    <BackLink :to="{ name: 'dashboard' }" />
    <ErrorState v-if="error && !show" :message="error" :on-retry="retry" />
    <div v-else-if="!show" class="grid gap-6 sm:grid-cols-[200px_1fr]">
      <Skeleton :height="'300px'" :width="'200px'" />
      <div class="flex flex-col gap-3">
        <Skeleton :height="'2rem'" :width="'60%'" />
        <Skeleton :height="'1rem'" :lines="4" />
      </div>
    </div>
    <template v-else>
      <header class="grid gap-6 sm:grid-cols-[200px_1fr]">
        <AppImage
          :src="show.image?.original ?? show.image?.medium ?? null"
          :alt="`${show.name} poster`"
        />
        <div class="flex flex-col gap-3">
          <h1
            data-route-heading
            tabindex="-1"
            class="text-3xl font-bold tracking-tight outline-none"
          >
            {{ show.name }}
          </h1>
          <div
            class="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-600 dark:text-slate-300"
          >
            <Rating :value="show.rating.average" />
            <span v-if="yearRange">{{ yearRange }}</span>
            <span v-if="show.status">{{ show.status }}</span>
            <span v-if="show.network">{{ show.network.name }}</span>
            <span v-else-if="show.webChannel">{{ show.webChannel.name }}</span>
            <span v-if="show.language">{{ show.language }}</span>
            <span v-if="show.runtime">{{ show.runtime }} min</span>
          </div>
          <div v-if="show.genres.length > 0" class="flex flex-wrap gap-2">
            <span
              v-for="g in show.genres"
              :key="g"
              class="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200"
            >
              {{ g }}
            </span>
          </div>
          <div
            v-if="summary"
            class="prose prose-sm max-w-none text-slate-700 dark:text-slate-200 [&_a]:underline"
            v-html="summary"
          />
        </div>
      </header>
      <CastList :cast="show._embedded?.cast ?? []" />
      <EpisodeList :episodes="show._embedded?.episodes ?? []" />
    </template>
  </article>
</template>
