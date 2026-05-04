import { describe, it, expect } from 'vitest'
import { stripHtml } from '../stripHtml'

describe('stripHtml', () => {
  it('strips script tags entirely', () => {
    const out = stripHtml('hello<script>alert(1)</script>world')
    expect(out).toBe('helloworld')
  })

  it('preserves the allow-list tags', () => {
    const out = stripHtml(
      '<p>A <b>bold</b> and <em>emphatic</em> <i>italic</i> <strong>strong</strong> line<br>break.</p>',
    )
    expect(out).toBe(
      '<p>A <b>bold</b> and <em>emphatic</em> <i>italic</i> <strong>strong</strong> line<br>break.</p>',
    )
  })

  it('strips attributes from allowed tags', () => {
    expect(stripHtml('<p class="x" onclick="bad()">hi</p>')).toBe('<p>hi</p>')
  })

  it('returns empty string for null/undefined', () => {
    expect(stripHtml(null)).toBe('')
    expect(stripHtml(undefined)).toBe('')
    expect(stripHtml('')).toBe('')
  })

  it('strips img with onerror payload', () => {
    expect(stripHtml('<img src=x onerror="alert(1)">hello')).toBe('hello')
  })
})
