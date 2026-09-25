// pg-backend wraps every response in a consistent envelope (see main.ts's global
// `ResponseInterceptor`/`AllExceptionsFilter`) — no controller returns a bare DTO.
// This is unwrapped centrally in client.ts so feature `api/*.ts` modules can keep
// treating `response.data` as the DTO directly.

export interface SuccessEnvelope<T> {
  success: true
  data: T
  requestId: string
}

export interface ErrorEnvelope {
  success: false
  error: {
    code: string
    message: string
    details?: unknown
  }
  requestId: string
}

export function isEnvelope(value: unknown): value is SuccessEnvelope<unknown> | ErrorEnvelope {
  return typeof value === 'object' && value !== null && 'success' in value
}
