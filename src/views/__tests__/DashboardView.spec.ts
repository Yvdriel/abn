import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createRouter, createMemoryHistory } from 'vue-router'
import { setActivePinia, createPinia } from 'pinia'
import DashboardView from '../DashboardView.vue'
import { useShowsStore } from '@/stores/shows'
import { useUiStore } from '@/stores/ui'
import { makeShow } from '@/__tests__/fixtures'

function makeRouter() {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', component: { template: '<div />' } },
      { path: '/shows/:id', name: 'show', component: { template: '<div />' } },
    ],
  })
}

// Make LazyMount mount its slot immediately, otherwise GenreRow contents
// are deferred behind IntersectionObserver.
class EagerIntersectionObserver {
  readonly root = null
  readonly rootMargin = ''
  readonly scrollMargin = ''
  readonly thresholds: ReadonlyArray<number> = []
  cb: IntersectionObserverCallback
  constructor(cb: IntersectionObserverCallback) {
    this.cb = cb
  }
  observe(): void {
    queueMicrotask(() =>
      this.cb(
        [{ isIntersecting: true } as IntersectionObserverEntry],
        this as unknown as IntersectionObserver,
      ),
    )
  }
  unobserve(): void {}
  disconnect(): void {}
  takeRecords(): IntersectionObserverEntry[] {
    return []
  }
}

const OriginalIO = globalThis.IntersectionObserver

beforeEach(() => {
  setActivePinia(createPinia())
  ;(
    globalThis as unknown as { IntersectionObserver: typeof IntersectionObserver }
  ).IntersectionObserver = EagerIntersectionObserver as unknown as typeof IntersectionObserver
})

afterEach(() => {
  ;(
    globalThis as unknown as { IntersectionObserver: typeof IntersectionObserver }
  ).IntersectionObserver = OriginalIO
})

describe('DashboardView', () => {
  it('renders one GenreRow per genre when shows are loaded', async () => {
    const store = useShowsStore()
    store.ingestShows([
      makeShow({ id: 1, name: 'A', genres: ['Drama'], rating: { average: 9 } }),
      makeShow({ id: 2, name: 'B', genres: ['Comedy'], rating: { average: 8 } }),
    ])
    const wrapper = mount(DashboardView, { global: { plugins: [makeRouter()] } })
    await flushPromises()
    const headings = wrapper.findAll('h2').map((h) => h.text())
    expect(headings.some((t) => t.includes('Drama'))).toBe(true)
    expect(headings.some((t) => t.includes('Comedy'))).toBe(true)
  })

  it('shows the empty-filters state when filters exclude every show', async () => {
    const store = useShowsStore()
    store.ingestShows([
      makeShow({ id: 1, genres: ['Drama'], rating: { average: 5 } }),
      makeShow({ id: 2, genres: ['Comedy'], rating: { average: 6 } }),
    ])
    const ui = useUiStore()
    ui.setFilter('minRating', { min: 9.5 })

    const wrapper = mount(DashboardView, { global: { plugins: [makeRouter()] } })
    await flushPromises()
    expect(wrapper.text()).toContain('No shows match your filters')
  })

  it('renders the page heading regardless of data', async () => {
    const wrapper = mount(DashboardView, { global: { plugins: [makeRouter()] } })
    await flushPromises()
    const h1 = wrapper.find('h1[data-route-heading]')
    expect(h1.exists()).toBe(true)
    expect(h1.text()).toBe('Browse shows')
  })
})
