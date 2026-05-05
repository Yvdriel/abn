import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createRouter, createMemoryHistory } from 'vue-router'
import { setActivePinia, createPinia } from 'pinia'
import SearchResultsView from '../SearchResultsView.vue'
import { useShowsStore } from '@/stores/shows'
import { _resetInFlightForTests } from '@/api/tvmazeClient'
import { makeShow } from '@/__tests__/fixtures'

function makeRouter() {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', component: { template: '<div />' } },
      { path: '/shows/:id', name: 'show', component: { template: '<div />' } },
      { path: '/search', name: 'search', component: SearchResultsView },
    ],
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

describe('SearchResultsView', () => {
  it('shows the prompt to type a query when q is empty', async () => {
    const router = makeRouter()
    await router.push('/search')
    await router.isReady()

    const wrapper = mount(SearchResultsView, { global: { plugins: [router] } })
    await vi.advanceTimersByTimeAsync(310)
    expect(wrapper.text()).toContain('Type a query')
  })

  it('renders local results without firing remote when local count >= 5', async () => {
    const store = useShowsStore()
    store.ingestShows([
      makeShow({ id: 1, name: 'The Crown' }),
      makeShow({ id: 2, name: 'Crown Heights' }),
      makeShow({ id: 3, name: 'Crown of Thorns' }),
      makeShow({ id: 4, name: 'Crowning' }),
      makeShow({ id: 5, name: 'My Crown Show' }),
    ])
    const fetchMock = globalThis.fetch as unknown as ReturnType<typeof vi.fn>

    const router = makeRouter()
    await router.push({ path: '/search', query: { q: 'crown' } })
    await router.isReady()

    const wrapper = mount(SearchResultsView, { global: { plugins: [router] } })
    await vi.advanceTimersByTimeAsync(310)
    await flushPromises()

    expect(wrapper.findAll('a').length).toBe(5)
    expect(wrapper.text()).toContain('Results for')
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('renders the heading even before debounce settles', async () => {
    const router = makeRouter()
    await router.push({ path: '/search', query: { q: 'lost' } })
    await router.isReady()

    const wrapper = mount(SearchResultsView, { global: { plugins: [router] } })
    await flushPromises()
    expect(wrapper.find('h1').text()).toContain('Results for')
  })
})
