import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { effectScope, ref } from 'vue'
import { setActivePinia, createPinia } from 'pinia'
import { useShowSearch } from '../useShowSearch'
import { useShowsStore } from '@/stores/shows'
import { _resetInFlightForTests } from '@/api/tvmazeClient'
import { makeShow } from '@/__tests__/fixtures'

function jsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
}

beforeEach(() => {
  setActivePinia(createPinia())
  _resetInFlightForTests()
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('useShowSearch', () => {
  it('returns local results without firing remote when local count >= 5', async () => {
    const store = useShowsStore()
    store.ingestShows([
      makeShow({ id: 1, name: 'The Crown' }),
      makeShow({ id: 2, name: 'Crown Heights' }),
      makeShow({ id: 3, name: 'Crown of Thorns' }),
      makeShow({ id: 4, name: 'Crowning' }),
      makeShow({ id: 5, name: 'My Crown Show' }),
    ])
    const fetchMock = globalThis.fetch as unknown as ReturnType<typeof vi.fn>

    const scope = effectScope()
    const query = ref('crown')
    let r!: ReturnType<typeof useShowSearch>
    scope.run(() => {
      r = useShowSearch(query)
    })
    await vi.advanceTimersByTimeAsync(310)
    expect(r.results.value.length).toBe(5)
    expect(fetchMock).not.toHaveBeenCalled()
    scope.stop()
  })

  it('fires remote when local results < 5', async () => {
    const store = useShowsStore()
    store.ingestShows([makeShow({ id: 1, name: 'Crown' })])
    const fetchMock = globalThis.fetch as unknown as ReturnType<typeof vi.fn>
    fetchMock.mockResolvedValueOnce(
      jsonResponse([
        { score: 0.9, show: makeShow({ id: 100, name: 'The Crown' }) },
        { score: 0.8, show: makeShow({ id: 1, name: 'Crown' }) },
      ]),
    )

    const scope = effectScope()
    const query = ref('crown')
    let r!: ReturnType<typeof useShowSearch>
    scope.run(() => {
      r = useShowSearch(query)
    })
    await vi.advanceTimersByTimeAsync(310)
    await vi.runAllTimersAsync()
    await Promise.resolve()

    expect(fetchMock).toHaveBeenCalledTimes(1)
    const ids = r.results.value.map((s) => s.show.id).sort()
    expect(ids).toContain(1)
    expect(ids).toContain(100)
    expect(new Set(ids).size).toBe(ids.length) // dedup by id
    scope.stop()
  })

  it('clears results on empty query', async () => {
    const scope = effectScope()
    const query = ref('')
    let r!: ReturnType<typeof useShowSearch>
    scope.run(() => {
      r = useShowSearch(query)
    })
    await vi.advanceTimersByTimeAsync(310)
    expect(r.results.value).toEqual([])
    expect(r.loading.value).toBe(false)
    scope.stop()
  })
})
