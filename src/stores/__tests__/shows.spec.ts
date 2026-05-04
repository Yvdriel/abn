import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useShowsStore } from '../shows'
import { _resetInFlightForTests } from '@/api/tvmazeClient'
import { makeShow } from '@/__tests__/fixtures'

function jsonResponse(body: unknown, init: ResponseInit = {}): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
    ...init,
  })
}

function errorResponse(status: number): Response {
  return new Response('', { status, statusText: `STATUS_${status}` })
}

beforeEach(() => {
  setActivePinia(createPinia())
  _resetInFlightForTests()
  vi.useFakeTimers({ shouldAdvanceTime: true })
})

afterEach(() => {
  vi.useRealTimers()
})

describe('useShowsStore.ingestShows', () => {
  it('upserts byId', () => {
    const store = useShowsStore()
    store.ingestShows([makeShow({ id: 1 }), makeShow({ id: 2 })])
    expect(Object.keys(store.state.byId)).toEqual(['1', '2'])
  })

  it('builds genreIndex with lowercase keys', () => {
    const store = useShowsStore()
    store.ingestShows([
      makeShow({ id: 1, genres: ['Drama', 'Crime'] }),
      makeShow({ id: 2, genres: ['drama'] }),
    ])
    expect(store.state.genreIndex.drama).toEqual([1, 2])
    expect(store.state.genreIndex.crime).toEqual([1])
  })

  it('preserves first-seen displayName casing', () => {
    const store = useShowsStore()
    store.ingestShows([makeShow({ id: 1, genres: ['Drama'] })])
    store.ingestShows([makeShow({ id: 2, genres: ['drama'] })])
    expect(store.state.genreDisplayName.drama).toBe('Drama')
  })

  it('dedupes ids within a bucket on re-ingest', () => {
    const store = useShowsStore()
    store.ingestShows([makeShow({ id: 1, genres: ['Drama'] })])
    store.ingestShows([makeShow({ id: 1, genres: ['Drama'] })])
    expect(store.state.genreIndex.drama).toEqual([1])
  })

  it('routes empty genres into the uncategorized bucket', () => {
    const store = useShowsStore()
    store.ingestShows([makeShow({ id: 9, genres: [] })])
    expect(store.state.genreIndex.uncategorized).toEqual([9])
    expect(store.state.genreDisplayName.uncategorized).toBe('Uncategorized')
  })
})

describe('useShowsStore.showsByGenre', () => {
  it('returns shows in a bucket sorted by rating desc, nulls last', () => {
    const store = useShowsStore()
    store.ingestShows([
      makeShow({ id: 1, genres: ['Drama'], rating: { average: 7 } }),
      makeShow({ id: 2, genres: ['Drama'], rating: { average: 9 } }),
      makeShow({ id: 3, genres: ['Drama'], rating: { average: null } }),
    ])
    expect(store.showsByGenre('drama').map((s) => s.id)).toEqual([2, 1, 3])
  })
})

describe('useShowsStore.fetchPage / paginator', () => {
  it('fetchPage records loaded status and ingests', async () => {
    const store = useShowsStore()
    const fetchMock = globalThis.fetch as unknown as ReturnType<typeof vi.fn>
    fetchMock.mockResolvedValueOnce(jsonResponse([makeShow({ id: 42, genres: ['Comedy'] })]))
    await store.fetchPage(0)
    expect(store.state.byId[42]).toBeDefined()
    expect(store.state.pages[0]?.status).toBe('loaded')
  })

  it('fetchPage skips when status is loaded', async () => {
    const store = useShowsStore()
    const fetchMock = globalThis.fetch as unknown as ReturnType<typeof vi.fn>
    fetchMock.mockResolvedValueOnce(jsonResponse([]))
    await store.fetchPage(0)
    fetchMock.mockClear()
    await store.fetchPage(0)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('paginator stops on EndOfPagesError and sets endPage', async () => {
    const store = useShowsStore()
    const fetchMock = globalThis.fetch as unknown as ReturnType<typeof vi.fn>
    fetchMock
      .mockResolvedValueOnce(jsonResponse([makeShow({ id: 1 })]))
      .mockResolvedValueOnce(jsonResponse([makeShow({ id: 2 })]))
      .mockResolvedValueOnce(errorResponse(404))

    await store.fetchFirstPage()
    const p = store.startBackgroundPaginator({ intervalMs: 0 })
    await vi.runAllTimersAsync()
    await p
    await vi.runAllTimersAsync()

    expect(store.state.paginator.status).toBe('done')
    expect(store.state.paginator.endPage).not.toBeNull()
  })
})

describe('useShowsStore.fetchShowDetail (SWR)', () => {
  it('serves cached when fresh and embedded', async () => {
    const store = useShowsStore()
    store.ingestShows([
      makeShow({
        id: 5,
        _embedded: { cast: [], episodes: [] },
      }),
    ])
    store.state.detailMeta[5] = { status: 'fresh', fetchedAt: Date.now() }
    const fetchMock = globalThis.fetch as unknown as ReturnType<typeof vi.fn>
    await store.fetchShowDetail(5)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('refetches when stale', async () => {
    const store = useShowsStore()
    store.ingestShows([
      makeShow({
        id: 5,
        _embedded: { cast: [], episodes: [] },
      }),
    ])
    store.state.detailMeta[5] = {
      status: 'stale',
      fetchedAt: Date.now() - 10 * 60 * 1000,
    }
    const fetchMock = globalThis.fetch as unknown as ReturnType<typeof vi.fn>
    fetchMock.mockResolvedValueOnce(
      jsonResponse(makeShow({ id: 5, _embedded: { cast: [], episodes: [] } })),
    )
    await store.fetchShowDetail(5)
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(store.state.detailMeta[5]?.status).toBe('fresh')
  })
})

describe('useShowsStore.reset', () => {
  it('clears state', () => {
    const store = useShowsStore()
    store.ingestShows([makeShow({ id: 1 })])
    store.reset()
    expect(store.state.byId).toEqual({})
    expect(store.state.genreIndex).toEqual({})
    expect(store.state.paginator.status).toBe('idle')
  })
})
