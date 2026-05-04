import { describe, it, expect } from 'vitest'
import { formatDate, formatYear } from '../formatDate'

describe('formatDate', () => {
  it('formats ISO date in en-US', () => {
    expect(formatDate('2025-03-04')).toBe('Mar 4, 2025')
  })

  it('returns empty for null/undefined', () => {
    expect(formatDate(null)).toBe('')
    expect(formatDate(undefined)).toBe('')
  })

  it('returns empty for invalid input', () => {
    expect(formatDate('not-a-date')).toBe('')
  })
})

describe('formatYear', () => {
  it('extracts the year', () => {
    expect(formatYear('2020-06-15')).toBe('2020')
  })

  it('returns empty for invalid', () => {
    expect(formatYear(null)).toBe('')
    expect(formatYear('garbage')).toBe('')
  })
})
