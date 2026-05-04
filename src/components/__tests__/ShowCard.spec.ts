import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createRouter, createMemoryHistory } from 'vue-router'
import ShowCard from '../ShowCard.vue'
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

describe('ShowCard', () => {
  it('renders the show name', () => {
    const wrapper = mount(ShowCard, {
      props: { show: makeShow({ name: 'The Crown' }) },
      global: { plugins: [makeRouter()] },
    })
    expect(wrapper.text()).toContain('The Crown')
  })

  it('renders the rating', () => {
    const wrapper = mount(ShowCard, {
      props: { show: makeShow({ rating: { average: 8.4 } }) },
      global: { plugins: [makeRouter()] },
    })
    expect(wrapper.text()).toContain('8.4')
  })

  it('shows placeholder when image is null', () => {
    const wrapper = mount(ShowCard, {
      props: { show: makeShow({ image: null, name: 'X' }) },
      global: { plugins: [makeRouter()] },
    })
    expect(wrapper.find('img').exists()).toBe(false)
    expect(wrapper.find('[role="img"]').exists()).toBe(true)
  })

  it('shows em-dash when rating is null', () => {
    const wrapper = mount(ShowCard, {
      props: { show: makeShow({ rating: { average: null } }) },
      global: { plugins: [makeRouter()] },
    })
    expect(wrapper.text()).toContain('—')
  })

  it('renders router-link to /shows/:id', () => {
    const wrapper = mount(ShowCard, {
      props: { show: makeShow({ id: 42 }) },
      global: { plugins: [makeRouter()] },
    })
    expect(wrapper.find('a').attributes('href')).toBe('/shows/42')
  })

  it('highlights matched substring when queryHighlight is set', () => {
    const wrapper = mount(ShowCard, {
      props: { show: makeShow({ name: 'The Crown' }), queryHighlight: 'crown' },
      global: { plugins: [makeRouter()] },
    })
    const mark = wrapper.find('mark')
    expect(mark.exists()).toBe(true)
    expect(mark.text()).toBe('Crown')
  })

  it('falls back to "Untitled" for empty name', () => {
    const wrapper = mount(ShowCard, {
      props: { show: makeShow({ name: '' }) },
      global: { plugins: [makeRouter()] },
    })
    expect(wrapper.text()).toContain('Untitled')
  })
})
