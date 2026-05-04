import { describe, it, expect } from 'vitest'
import { rewriteHttpsDeep } from '../httpsRewrite'

describe('rewriteHttpsDeep', () => {
  it('rewrites tvmaze static and api hosts', () => {
    expect(rewriteHttpsDeep('http://static.tvmaze.com/uploads/x.jpg')).toBe(
      'https://static.tvmaze.com/uploads/x.jpg',
    )
    expect(rewriteHttpsDeep('http://api.tvmaze.com/shows/1')).toBe('https://api.tvmaze.com/shows/1')
  })

  it('leaves unrelated http URLs untouched', () => {
    expect(rewriteHttpsDeep('http://example.org/foo')).toBe('http://example.org/foo')
  })

  it('walks nested objects and arrays', () => {
    const input = {
      image: { medium: 'http://static.tvmaze.com/m.jpg', original: null },
      cast: [
        { person: { image: { medium: 'http://static.tvmaze.com/p.jpg' } } },
        { person: { image: null } },
      ],
      summary: '<p>see <a href="http://example.org">here</a></p>',
    }
    const out = rewriteHttpsDeep(input)
    expect(out.image.medium).toBe('https://static.tvmaze.com/m.jpg')
    expect(out.image.original).toBeNull()
    expect(out.cast[0]!.person.image!.medium).toBe('https://static.tvmaze.com/p.jpg')
    expect(out.cast[1]!.person.image).toBeNull()
    expect(out.summary).toBe('<p>see <a href="http://example.org">here</a></p>')
  })

  it('passes through primitives unchanged', () => {
    expect(rewriteHttpsDeep(42)).toBe(42)
    expect(rewriteHttpsDeep(null)).toBeNull()
    expect(rewriteHttpsDeep(true)).toBe(true)
  })
})
