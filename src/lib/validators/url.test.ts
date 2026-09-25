import { describe, expect, it } from 'vitest'
import { isSafeHttpUrl } from './url'

describe('isSafeHttpUrl', () => {
  it.each(['https://example.com/photo.jpg', 'http://example.com/photo.png'])('accepts %s', (url) => {
    expect(isSafeHttpUrl(url)).toBe(true)
  })

  it.each([
    'javascript:alert(1)',
    'data:text/html,<script>alert(1)</script>',
    'not a url',
    '',
    'ftp://example.com/photo.jpg',
  ])('rejects %s', (url) => {
    expect(isSafeHttpUrl(url)).toBe(false)
  })
})
