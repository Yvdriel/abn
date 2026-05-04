import { onScopeDispose, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUiStore } from '@/stores/ui'

const URL_DEBOUNCE_MS = 250

export function useUrlState(): void {
  const route = useRoute()
  const router = useRouter()
  const ui = useUiStore()

  function readQueryAsRecord(): Record<string, string | string[] | null | undefined> {
    const out: Record<string, string | string[] | null | undefined> = {}
    for (const [k, v] of Object.entries(route.query)) {
      if (v === undefined || v === null) {
        out[k] = undefined
      } else if (Array.isArray(v)) {
        out[k] = v.filter((x): x is string => typeof x === 'string')
      } else {
        out[k] = v
      }
    }
    return out
  }

  ui.hydrateFromUrl(readQueryAsRecord())

  let writeTimer: ReturnType<typeof setTimeout> | null = null

  const stopHydrate = watch(
    () => route.query,
    () => {
      ui.hydrateFromUrl(readQueryAsRecord())
    },
  )

  const stopWrite = watch(
    () => ui.serializeToQuery(),
    (next) => {
      if (writeTimer !== null) clearTimeout(writeTimer)
      writeTimer = setTimeout(() => {
        const current = route.query
        const same =
          Object.keys(next).length === Object.keys(current).length &&
          Object.entries(next).every(([k, v]) => current[k] === v)
        if (same) return
        void router.replace({ path: route.path, query: next })
      }, URL_DEBOUNCE_MS)
    },
    { deep: true },
  )

  onScopeDispose(() => {
    if (writeTimer !== null) clearTimeout(writeTimer)
    stopHydrate()
    stopWrite()
  })
}
