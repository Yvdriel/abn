import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import AppImage from '../AppImage.vue'

describe('AppImage', () => {
  it('renders an <img> with lazy + decoding when src is set', () => {
    const wrapper = mount(AppImage, {
      props: { src: 'https://example.test/x.jpg', alt: 'Cover for The Crown' },
    })
    const img = wrapper.find('img')
    expect(img.exists()).toBe(true)
    expect(img.attributes('loading')).toBe('lazy')
    expect(img.attributes('decoding')).toBe('async')
    expect(img.attributes('alt')).toBe('Cover for The Crown')
  })

  it('renders the placeholder when src is null and exposes the alt as aria-label', () => {
    const wrapper = mount(AppImage, { props: { src: null, alt: 'Placeholder for Show X' } })
    expect(wrapper.find('img').exists()).toBe(false)
    const placeholder = wrapper.find('[role="img"]')
    expect(placeholder.exists()).toBe(true)
    expect(placeholder.attributes('aria-label')).toBe('Placeholder for Show X')
  })

  it('alt is always present', () => {
    const wrapper = mount(AppImage, { props: { src: 'https://x', alt: 'Required' } })
    expect(wrapper.find('img').attributes('alt')).toBe('Required')
  })
})
