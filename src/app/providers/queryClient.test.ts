import { describe, expect, it } from 'vitest'
import { ApiError, type ApiErrorKind } from '@/infrastructure/api/errors'
import { shouldRetry } from './queryClient'

const err = (kind: ApiErrorKind) => new ApiError({ message: kind, kind, status: null })

describe('query retry policy', () => {
  it.each(['unauthorized', 'forbidden', 'not_found', 'validation', 'conflict', 'rate_limited'] as const)(
    'never retries %s (retrying cannot fix it; 429 would deepen the throttle)',
    (kind) => {
      expect(shouldRetry(0, err(kind))).toBe(false)
    },
  )

  it('retries transient server/network failures at most twice', () => {
    for (const kind of ['server', 'network'] as const) {
      expect(shouldRetry(0, err(kind))).toBe(true)
      expect(shouldRetry(1, err(kind))).toBe(true)
      expect(shouldRetry(2, err(kind))).toBe(false)
    }
  })
})
