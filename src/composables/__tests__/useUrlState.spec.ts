import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, nextTick } from 'vue'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import { createRouter, createMemoryHistory } from 'vue-router'
import { useUrlState } from '../useUrlState'
import { useUiStore } from '@/stores/ui'

const Harness = defineComponent({
  setup() {
    useUrlState()
    return () => h('div')
  },
})

beforeEach(() => {
  setActivePinia(createPinia())
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('useUrlState', () => {
  it('hydrates store from initial route query', async () => {
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [{ path: '/', component: { template: '<div />' } }],
    })
    await router.push({ path: '/', query: { q: 'crown', genre: 'drama', minRating: '8' } })
    await router.isReady()

    const wrapper = mount(Harness, { global: { plugins: [router] } })
    const ui = useUiStore()
    expect(ui.state.searchQuery).toBe('crown')
    expect(ui.filterById('genre')?.params).toEqual({ values: ['drama'] })
    expect(ui.filterById('minRating')?.params).toEqual({ min: 8 })
    wrapper.unmount()
  })

  it('writes store changes to the URL via router.replace (debounced)', async () => {
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [{ path: '/', component: { template: '<div />' } }],
    })
    await router.push('/')
    await router.isReady()
    const replaceSpy = vi.spyOn(router, 'replace')

    const wrapper = mount(Harness, { global: { plugins: [router] } })
    const ui = useUiStore()
    ui.setSearchQuery('lost')
    await nextTick()
    // not yet
    expect(replaceSpy).not.toHaveBeenCalled()
    await vi.advanceTimersByTimeAsync(300)
    expect(replaceSpy).toHaveBeenCalledWith(expect.objectContaining({ query: { q: 'lost' } }))
    wrapper.unmount()
  })
})
