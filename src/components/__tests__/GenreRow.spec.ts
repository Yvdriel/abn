import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createRouter, createMemoryHistory } from 'vue-router'
import { setActivePinia, createPinia } from 'pinia'
import GenreRow from '../GenreRow.vue'
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

// Make LazyMount mount its slot immediately by stubbing IntersectionObserver
// to fire `isIntersecting: true` as soon as observe() is called.
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

describe('GenreRow', () => {
  it('renders the heading with the display name and count', async () => {
    const store = useShowsStore()
    store.ingestShows([
      makeShow({ id: 1, name: 'A', genres: ['Drama'], rating: { average: 9 } }),
      makeShow({ id: 2, name: 'B', genres: ['Drama'], rating: { average: 8 } }),
    ])
    const wrapper = mount(GenreRow, {
      props: { genreKey: 'drama', displayName: 'Drama' },
      global: { plugins: [makeRouter()] },
    })
    await flushPromises()
    expect(wrapper.find('h2').text()).toContain('Drama')
    expect(wrapper.find('h2').text()).toContain('(2)')
  })

  it('exposes a region landmark with the genre as the accessible label', async () => {
    const store = useShowsStore()
    store.ingestShows([makeShow({ id: 1, name: 'X', genres: ['Comedy'] })])
    const wrapper = mount(GenreRow, {
      props: { genreKey: 'comedy', displayName: 'Comedy' },
      global: { plugins: [makeRouter()] },
    })
    await flushPromises()
    const region = wrapper.find('[role="region"]')
    expect(region.exists()).toBe(true)
    expect(region.attributes('aria-labelledby')).toBeDefined()
  })

  it('only renders shows passing the active filter predicate', async () => {
    const store = useShowsStore()
    store.ingestShows([
      makeShow({ id: 1, name: 'High', genres: ['Drama'], rating: { average: 9 } }),
      makeShow({ id: 2, name: 'Low', genres: ['Drama'], rating: { average: 5 } }),
    ])
    const ui = useUiStore()
    ui.setFilter('minRating', { min: 7 })

    const wrapper = mount(GenreRow, {
      props: { genreKey: 'drama', displayName: 'Drama' },
      global: { plugins: [makeRouter()] },
    })
    await flushPromises()
    expect(wrapper.find('h2').text()).toContain('(1)')
    const links = wrapper.findAll('a')
    expect(links.length).toBe(1)
    expect(wrapper.text()).toContain('High')
    expect(wrapper.text()).not.toContain('Low')
  })

  it('self-suppresses when filters exclude every show in the bucket', async () => {
    const store = useShowsStore()
    store.ingestShows([makeShow({ id: 1, name: 'A', genres: ['Drama'], rating: { average: 5 } })])
    const ui = useUiStore()
    ui.setFilter('minRating', { min: 9 })

    const wrapper = mount(GenreRow, {
      props: { genreKey: 'drama', displayName: 'Drama' },
      global: { plugins: [makeRouter()] },
    })
    await flushPromises()
    expect(wrapper.find('section').exists()).toBe(false)
  })
})
