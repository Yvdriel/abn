import { describe, it, expect } from 'vitest'
import { languageFilter } from '../languageFilter'
import { makeShow } from '@/__tests__/fixtures'

describe('languageFilter', () => {
  it('matches when language is in the values list', () => {
    const pred = languageFilter.predicate({ values: ['english'] })
    expect(pred(makeShow({ language: 'English' }))).toBe(true)
    expect(pred(makeShow({ language: 'Japanese' }))).toBe(false)
  })

  it('null language never matches an active filter', () => {
    const pred = languageFilter.predicate({ values: ['english'] })
    expect(pred(makeShow({ language: null }))).toBe(false)
  })

  it('with empty values is inactive', () => {
    expect(languageFilter.isActive({ values: [] })).toBe(false)
    expect(languageFilter.predicate({ values: [] })(makeShow({ language: null }))).toBe(true)
  })

  it('round-trips serialize/deserialize', () => {
    expect(languageFilter.serialize({ values: [] })).toBeUndefined()
    expect(languageFilter.serialize({ values: ['English', 'Japanese'] })).toBe('english,japanese')
    expect(languageFilter.deserialize('english,japanese')).toEqual({
      values: ['english', 'japanese'],
    })
  })
})
