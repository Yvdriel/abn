import { onScopeDispose, ref, watch, type Ref } from 'vue'
import { searchShows } from '@/api/endpoints'
import { useShowsStore } from '@/stores/shows'
import { useDebouncedRef } from './useDebouncedRef'
import { scoreShowAgainstQuery } from '@/utils/score'
import { sortByRating } from '@/utils/sortByRating'
import type { ScoredShow } from '@/types/ui'
import type { TvMazeShow } from '@/types/tvmaze'

const DEBOUNCE_MS = 300
const LOCAL_THRESHOLD = 5
const MAX_RESULTS = 30

export interface UseShowSearchReturn {
  results: Ref<ScoredShow[]>
  loading: Ref<boolean>
  error: Ref<Error | null>
}

export function useShowSearch(query: Ref<string>): UseShowSearchReturn {
  const debounced = useDebouncedRef(query, DEBOUNCE_MS)
  const results = ref<ScoredShow[]>([])
  const loading = ref(false)
  const error = ref<Error | null>(null)
  const showsStore = useShowsStore()

  let activeController: AbortController | null = null

  function localSearch(q: string): ScoredShow[] {
    const trimmed = q.trim()
    if (trimmed.length === 0) return []
    const scored: ScoredShow[] = []
    for (const id in showsStore.state.byId) {
      const show = showsStore.state.byId[id]
      if (!show) continue
      const s = scoreShowAgainstQuery(show, trimmed)
      if (s > 0) scored.push({ show, score: s, source: 'local' })
    }
    scored.sort((a, b) => {
      if (a.score !== b.score) return b.score - a.score
      return sortByRating(a.show, b.show)
    })
    return scored.slice(0, MAX_RESULTS)
  }

  async function run(q: string): Promise<void> {
    if (activeController) activeController.abort()
    error.value = null

    const trimmed = q.trim()
    if (trimmed.length === 0) {
      results.value = []
      loading.value = false
      return
    }

    const local = localSearch(trimmed)
    results.value = local
    if (local.length >= LOCAL_THRESHOLD) {
      loading.value = false
      return
    }

    loading.value = true
    const ctrl = new AbortController()
    activeController = ctrl
    try {
      const remote = await searchShows(trimmed, { signal: ctrl.signal })
      if (ctrl.signal.aborted) return

      const seen = new Set<number>(local.map((s) => s.show.id))
      const merged: ScoredShow[] = [...local]
      for (const r of remote) {
        const show: TvMazeShow = r.show
        if (seen.has(show.id)) continue
        seen.add(show.id)
        merged.push({ show, score: r.score, source: 'remote' })
      }
      results.value = merged.slice(0, MAX_RESULTS)
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return
      error.value = err instanceof Error ? err : new Error('Search failed')
    } finally {
      if (activeController === ctrl) {
        activeController = null
        loading.value = false
      }
    }
  }

  const stop = watch(
    debounced,
    (q) => {
      void run(q)
    },
    { immediate: true },
  )

  onScopeDispose(() => {
    if (activeController) activeController.abort()
    stop()
  })

  return { results, loading, error }
}
