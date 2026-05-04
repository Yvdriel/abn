import { computed, markRaw, reactive, ref, shallowRef } from 'vue'
import { defineStore } from 'pinia'
import type { ShowsState, PageMeta, PaginatorState, DetailMeta } from '@/types/ui'
import type { TvMazeShow, EmbedKey } from '@/types/tvmaze'
import { getShow, getShowsPage } from '@/api/endpoints'
import { EndOfPagesError, TvMazeApiError } from '@/api/tvmazeClient'
import { sortByRating } from '@/utils/sortByRating'

const DETAIL_TTL_MS = 5 * 60 * 1000
const DEFAULT_PAGINATOR_INTERVAL_MS = 300
const UNCATEGORIZED_KEY = 'uncategorized'
const UNCATEGORIZED_DISPLAY = 'Uncategorized'

function emptyState(): ShowsState {
  return {
    byId: {},
    pages: {},
    genreIndex: {},
    genreDisplayName: {},
    sortedByGenre: {},
    languages: {},
    detailMeta: {},
    paginator: { status: 'idle', loadedPages: 0, endPage: null },
  }
}

export const useShowsStore = defineStore('shows', () => {
  const state = reactive<ShowsState>(emptyState())
  const paginatorTimer = shallowRef<ReturnType<typeof setTimeout> | null>(null)
  const pausedFlag = ref(false)

  function ingestShows(shows: TvMazeShow[]): void {
    const touchedKeys = new Set<string>()
    for (const show of shows) {
      // markRaw: shows are immutable wire data; deep-proxying every field of
      // every show is the dominant ingest cost on streaming pages.
      state.byId[show.id] = markRaw(show)
      if (show.language && !state.languages[show.language]) {
        state.languages[show.language] = true
      }
      const buckets = show.genres.length > 0 ? show.genres : [UNCATEGORIZED_DISPLAY]
      for (const raw of buckets) {
        const trimmed = raw.trim()
        if (trimmed.length === 0) continue
        const key = trimmed.toLowerCase()
        if (!state.genreIndex[key]) state.genreIndex[key] = []
        if (!state.genreDisplayName[key]) state.genreDisplayName[key] = trimmed
        const bucket = state.genreIndex[key]!
        if (!bucket.includes(show.id)) bucket.push(show.id)
        // Always invalidate: even if id was already present, a re-ingested
        // show may carry a new rating that affects sort order.
        touchedKeys.add(key)
      }
    }
    // Rebuild sorted arrays only for genres whose bucket actually changed.
    for (const key of touchedKeys) {
      const ids = state.genreIndex[key] ?? []
      const list: TvMazeShow[] = []
      for (const id of ids) {
        const show = state.byId[id]
        if (show) list.push(show)
      }
      list.sort(sortByRating)
      state.sortedByGenre[key] = list
    }
  }

  function setPageMeta(page: number, meta: PageMeta): void {
    state.pages[page] = meta
  }

  async function fetchPage(page: number): Promise<void> {
    const existing = state.pages[page]
    if (existing && (existing.status === 'loaded' || existing.status === 'loading')) {
      return
    }
    setPageMeta(page, { status: 'loading', fetchedAt: null })
    try {
      const shows = await getShowsPage(page)
      ingestShows(shows)
      setPageMeta(page, { status: 'loaded', fetchedAt: Date.now() })
    } catch (err) {
      if (err instanceof EndOfPagesError) {
        setPageMeta(page, { status: 'end', fetchedAt: Date.now() })
        throw err
      }
      const message = err instanceof Error ? err.message : 'Unknown error'
      setPageMeta(page, { status: 'error', fetchedAt: Date.now(), error: message })
      throw err
    }
  }

  async function fetchFirstPage(): Promise<void> {
    await fetchPage(0)
  }

  async function startBackgroundPaginator(opts?: { intervalMs?: number }): Promise<void> {
    if (state.paginator.status === 'streaming' || state.paginator.status === 'done') return
    state.paginator.status = 'streaming'
    pausedFlag.value = false
    const intervalMs = opts?.intervalMs ?? DEFAULT_PAGINATOR_INTERVAL_MS

    let nextPage = 1
    // skip pages already loaded
    while (state.pages[nextPage]?.status === 'loaded') nextPage++

    const tick = async (): Promise<void> => {
      if (pausedFlag.value) {
        state.paginator.status = 'paused'
        return
      }
      try {
        await fetchPage(nextPage)
        state.paginator.loadedPages = Math.max(state.paginator.loadedPages, nextPage + 1)
        nextPage++
        paginatorTimer.value = setTimeout(() => {
          void tick()
        }, intervalMs)
      } catch (err) {
        if (err instanceof EndOfPagesError) {
          state.paginator.status = 'done'
          state.paginator.endPage = nextPage
          return
        }
        const message = err instanceof Error ? err.message : 'Unknown error'
        state.paginator.status = 'error'
        state.paginator.lastError = message
      }
    }

    await tick()
  }

  function pauseBackgroundPaginator(): void {
    pausedFlag.value = true
    if (paginatorTimer.value) {
      clearTimeout(paginatorTimer.value)
      paginatorTimer.value = null
    }
    if (state.paginator.status === 'streaming') state.paginator.status = 'paused'
  }

  function resumeBackgroundPaginator(): void {
    if (state.paginator.status !== 'paused') return
    void startBackgroundPaginator()
  }

  function setDetailMeta(id: number, meta: DetailMeta): void {
    state.detailMeta[id] = meta
  }

  async function fetchShowDetail(
    id: number,
    embed: EmbedKey[] = ['cast', 'episodes'],
  ): Promise<void> {
    const meta = state.detailMeta[id]
    const existing = state.byId[id]
    const fresh = meta && meta.fetchedAt !== null && Date.now() - meta.fetchedAt < DETAIL_TTL_MS
    if (existing && fresh && existing._embedded?.cast && existing._embedded?.episodes) {
      return
    }
    setDetailMeta(id, { status: 'loading', fetchedAt: meta?.fetchedAt ?? null })
    try {
      const show = await getShow(id, embed)
      ingestShows([show])
      setDetailMeta(id, { status: 'fresh', fetchedAt: Date.now() })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      const status = err instanceof TvMazeApiError ? 'error' : 'error'
      setDetailMeta(id, { status, fetchedAt: meta?.fetchedAt ?? null, error: message })
      throw err
    }
  }

  function reset(): void {
    pauseBackgroundPaginator()
    Object.assign(state, emptyState())
    pausedFlag.value = false
  }

  function showsByGenre(genreKey: string): TvMazeShow[] {
    return state.sortedByGenre[genreKey.toLowerCase()] ?? []
  }

  const languages = computed(() => Object.keys(state.languages).sort())

  const genreKeysSorted = computed(() => {
    const keys = Object.keys(state.genreIndex)
    return keys.sort((a, b) => {
      if (a === UNCATEGORIZED_KEY) return 1
      if (b === UNCATEGORIZED_KEY) return -1
      const an = state.genreDisplayName[a] ?? a
      const bn = state.genreDisplayName[b] ?? b
      return an.localeCompare(bn)
    })
  })

  const totalShows = computed(() => Object.keys(state.byId).length)
  const isPaginating = computed(() => state.paginator.status === 'streaming')

  const progressFraction = computed(() => {
    const { loadedPages, endPage } = state.paginator
    if (endPage !== null) return Math.min(loadedPages / endPage, 1)
    if (loadedPages <= 0) return 0
    // Asymptote 0.95 when we don't yet know the end
    return 1 - Math.pow(0.7, loadedPages) * 0.95
  })

  return {
    // state (read-only via store ref convention; mutate via actions)
    state,
    // actions
    fetchFirstPage,
    fetchPage,
    startBackgroundPaginator,
    pauseBackgroundPaginator,
    resumeBackgroundPaginator,
    fetchShowDetail,
    ingestShows,
    reset,
    // getters
    showsByGenre,
    genreKeysSorted,
    languages,
    totalShows,
    isPaginating,
    progressFraction,
  }
})

export const _CONSTANTS_FOR_TESTS = {
  DETAIL_TTL_MS,
  UNCATEGORIZED_KEY,
  UNCATEGORIZED_DISPLAY,
  DEFAULT_PAGINATOR_INTERVAL_MS,
}

export type ShowsStore = ReturnType<typeof useShowsStore>
export type { PaginatorState, PageMeta, DetailMeta }
