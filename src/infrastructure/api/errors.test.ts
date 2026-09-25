import { AxiosError } from 'axios'
import { describe, expect, it } from 'vitest'
import { ApiError, normalizeError } from './errors'

// Mirrors pg-backend's AllExceptionsFilter envelope exactly:
// `{ success: false, error: { code, message, details? }, requestId }`.
function makeAxiosError(status: number, code: string, message: string): AxiosError {
  const error = new AxiosError('Request failed', String(status))
  error.response = {
    status,
    data: { success: false, error: { code, message }, requestId: 'test-request-id' },
    statusText: '',
    headers: {},
    config: {} as never,
  }
  return error
}

describe('normalizeError', () => {
  it('maps a 409 response to a conflict ApiError with a friendly message', () => {
    const result = normalizeError(makeAxiosError(409, 'BED_ALREADY_OCCUPIED', 'Bed already occupied'))
    expect(result).toBeInstanceOf(ApiError)
    expect(result.kind).toBe('conflict')
    expect(result.status).toBe(409)
  })

  it('surfaces the backend validation message for a 400', () => {
    const result = normalizeError(
      makeAxiosError(400, 'VALIDATION_FAILED', 'Name must be at least 2 characters'),
    )
    expect(result.kind).toBe('validation')
    expect(result.message).toBe('Name must be at least 2 characters')
  })

  it('never leaks a raw stack trace for a 500', () => {
    const result = normalizeError(
      makeAxiosError(500, 'INTERNAL_SERVER_ERROR', 'PrismaClientKnownRequestError: ...'),
    )
    expect(result.kind).toBe('server')
    expect(result.message).not.toContain('Prisma')
  })

  it('treats a response-less network failure as a network error', () => {
    const error = new AxiosError('Network Error')
    const result = normalizeError(error)
    expect(result.kind).toBe('network')
  })

  it('passes an already-normalized ApiError through unchanged', () => {
    const original = new ApiError({ message: 'x', kind: 'unknown', status: null })
    expect(normalizeError(original)).toBe(original)
  })
})

describe('normalizeError — Phase 3 error experience', () => {
  it('translates known 409 codes into actionable copy', () => {
    expect(normalizeError(makeAxiosError(409, 'BED_ALREADY_OCCUPIED', 'Bed already occupied')).message).toMatch(
      /different bed/i,
    )
    expect(normalizeError(makeAxiosError(409, 'VISIT_TIME_CONFLICT', 'conflict')).message).toMatch(/different slot/i)
  })

  it('falls back to the hand-written backend message for an unmapped domain 409', () => {
    const result = normalizeError(makeAxiosError(409, 'SOME_NEW_CONFLICT', 'Menu for this date already published'))
    expect(result.message).toBe('Menu for this date already published')
  })

  it('distinguishes a timeout from being offline without changing the kind the auth layer relies on', () => {
    const result = normalizeError(new AxiosError('timeout of 15000ms exceeded', 'ECONNABORTED'))
    expect(result.kind).toBe('network')
    expect(result.code).toBe('TIMEOUT')
    expect(result.message).toMatch(/too long/i)
  })

  it('parses per-field validation details', () => {
    const error = makeAxiosError(400, 'VALIDATION_FAILED', 'Validation failed')
    const data = error.response!.data as { error: Record<string, unknown> }
    data.error.details = [{ field: 'capacity', constraints: { min: 'capacity must not be less than 1' } }]
    expect(normalizeError(error).fieldErrors).toEqual({ capacity: ['capacity must not be less than 1'] })
  })

  it('maps 403 INSUFFICIENT_ROLE and 429 to clear messages', () => {
    expect(normalizeError(makeAxiosError(403, 'INSUFFICIENT_ROLE', 'x')).message).toMatch(/role/i)
    expect(normalizeError(makeAxiosError(429, 'RATE_LIMITED', 'x')).kind).toBe('rate_limited')
  })
})
