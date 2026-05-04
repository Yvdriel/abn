import { describe, it, expect } from 'vitest'
import { splitForHighlight } from '../highlight'

describe('splitForHighlight', () => {
  it('splits around the matched substring', () => {
    expect(splitForHighlight('Breaking Bad', 'aking')).toEqual([
      { text: 'Bre', match: false },
      { text: 'aking', match: true },
      { text: ' Bad', match: false },
    ])
  })

  it('returns whole text when no match', () => {
    expect(splitForHighlight('The Crown', 'zzz')).toEqual([{ text: 'The Crown', match: false }])
  })

  it('matches case-insensitively but preserves source casing', () => {
    expect(splitForHighlight('The Crown', 'crown')).toEqual([
      { text: 'The ', match: false },
      { text: 'Crown', match: true },
    ])
  })

  it('returns whole text on empty query', () => {
    expect(splitForHighlight('Show', '')).toEqual([{ text: 'Show', match: false }])
  })

  it('only highlights the first occurrence', () => {
    expect(splitForHighlight('aaaa', 'a')).toEqual([
      { text: 'a', match: true },
      { text: 'aaa', match: false },
    ])
  })
})
