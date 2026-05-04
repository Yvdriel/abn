import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import { createRouter, createMemoryHistory } from 'vue-router'
import { nextTick } from 'vue'
import SearchInput from '../SearchInput.vue'
import { useUiStore } from '@/stores/ui'

function makeRouter() {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', component: { template: '<div />' } },
      { path: '/search', name: 'search', component: { template: '<div />' } },
    ],
  })
}

beforeEach(() => {
  setActivePinia(createPinia())
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('SearchInput', () => {
  it('debounces writes to the store', async () => {
    const wrapper = mount(SearchInput, {
      global: { plugins: [makeRouter()] },
    })
    const ui = useUiStore()
    await wrapper.find('input').setValue('lost')
    expect(ui.state.searchQuery).toBe('')
    await vi.advanceTimersByTimeAsync(310)
    expect(ui.state.searchQuery).toBe('lost')
    wrapper.unmount()
  })

  it('Enter routes to /search with q', async () => {
    const router = makeRouter()
    const pushSpy = vi.spyOn(router, 'push')
    const wrapper = mount(SearchInput, { global: { plugins: [router] } })
    await wrapper.find('input').setValue('lost')
    await wrapper.find('input').trigger('keydown', { key: 'Enter' })
    expect(pushSpy).toHaveBeenCalledWith({ name: 'search', query: { q: 'lost' } })
    wrapper.unmount()
  })

  it('Escape clears value', async () => {
    const wrapper = mount(SearchInput, { global: { plugins: [makeRouter()] } })
    const ui = useUiStore()
    ui.setSearchQuery('foo')
    await nextTick()
    await wrapper.find('input').trigger('keydown', { key: 'Escape' })
    expect(ui.state.searchQuery).toBe('')
    wrapper.unmount()
  })

  it('clear button is visible only when value is non-empty', async () => {
    const wrapper = mount(SearchInput, { global: { plugins: [makeRouter()] } })
    expect(wrapper.find('button[aria-label="Clear search"]').exists()).toBe(false)
    await wrapper.find('input').setValue('x')
    expect(wrapper.find('button[aria-label="Clear search"]').exists()).toBe(true)
    wrapper.unmount()
  })
})
