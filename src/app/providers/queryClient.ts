import { QueryClient } from '@tanstack/react-query'
import { ApiError } from '@/infrastructure/api/errors'

// Errors that retrying can't fix. 409 conflicts and 429 rate limits are also excluded: a conflict
// won't resolve itself, and retrying into pg-backend's global throttler (100 req/min) only extends
// the lockout.
const NON_RETRYABLE = new Set(['unauthorized', 'forbidden', 'not_found', 'validation', 'conflict', 'rate_limited'])

export function shouldRetry(failureCount: number, error: unknown) {
  if (error instanceof ApiError && NON_RETRYABLE.has(error.kind)) return false
  return failureCount < 2
}

/** The one place query defaults live — used by the app and by tests, so tests exercise the same
 * cache behaviour (e.g. staleTime de-duplicating fetches across components) as production. */
export function createQueryClient({ retry = true }: { retry?: boolean } = {}) {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: retry ? shouldRetry : false,
        staleTime: 30_000,
        refetchOnWindowFocus: false,
      },
      mutations: {
        retry: false,
      },
    },
  })
}
