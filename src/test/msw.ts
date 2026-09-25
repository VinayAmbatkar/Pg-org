import { delay, http, HttpResponse } from 'msw'
import { env } from '@/app/config/env'

// Response builders matching pg-backend's envelope exactly, for per-test `server.use(...)` overrides.
export const api = (path: string) => `${env.apiUrl}${path}`

export const ok = <T,>(data: T, status = 200) => HttpResponse.json({ success: true, data, requestId: 'test-request-id' }, { status })

export const fail = (status: number, code: string, message = code) =>
  HttpResponse.json({ success: false, error: { code, message }, requestId: 'test-request-id' }, { status })

/** Canonical failure for each HTTP state the UI must handle. */
export const failures = {
  unauthorized: () => fail(401, 'UNAUTHORIZED', 'Unauthorized'),
  forbidden: () => fail(403, 'INSUFFICIENT_ROLE', 'Insufficient role'),
  notFound: () => fail(404, 'NOT_FOUND', 'Not found'),
  conflict: (code = 'CONFLICT') => fail(409, code, 'Conflict'),
  rateLimited: () => fail(429, 'RATE_LIMITED', 'Too many requests'),
  server: () => fail(500, 'INTERNAL_SERVER_ERROR', 'PrismaClientKnownRequestError: secret internals'),
  network: () => HttpResponse.error(),
}

/** A GET handler that never resolves within a test — for asserting loading states. */
export const pendingForever = (path: string) =>
  http.get(api(path), async () => {
    await delay('infinite')
    return ok(null)
  })
