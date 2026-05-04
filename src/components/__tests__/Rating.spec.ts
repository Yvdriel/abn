import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import Rating from '../Rating.vue'

describe('Rating', () => {
  it('renders the value to one decimal place', () => {
    const wrapper = mount(Rating, { props: { value: 8.4 } })
    expect(wrapper.text()).toContain('8.4')
  })

  it('renders an em-dash when value is null', () => {
    const wrapper = mount(Rating, { props: { value: null } })
    expect(wrapper.text()).toContain('—')
  })

  it('aria-label includes the value', () => {
    const wrapper = mount(Rating, { props: { value: 7.6 } })
    expect(wrapper.attributes('aria-label')).toBe('Rating: 7.6 out of 10')
  })

  it('aria-label declares no rating when null', () => {
    const wrapper = mount(Rating, { props: { value: null } })
    expect(wrapper.attributes('aria-label')).toBe('No rating available')
  })
})
