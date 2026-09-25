import { AxiosError } from 'axios'

export type ApiErrorKind =
  | 'validation'
  | 'unauthorized'
  | 'forbidden'
  | 'not_found'
  | 'conflict'
  | 'rate_limited'
  | 'server'
  | 'network'
  | 'unknown'

export class ApiError extends Error {
  readonly kind: ApiErrorKind
  readonly status: number | null
  readonly code: string | null
  readonly fieldErrors: Record<string, string[]> | null

  constructor(params: {
    message: string
    kind: ApiErrorKind
    status: number | null
    code?: string | null
    fieldErrors?: Record<string, string[]> | null
  }) {
    super(params.message)
    this.name = 'ApiError'
    this.kind = params.kind
    this.status = params.status
    this.code = params.code ?? null
    this.fieldErrors = params.fieldErrors ?? null
  }
}

function kindFromStatus(status: number | undefined): ApiErrorKind {
  if (status === undefined) return 'network'
  if (status === 400) return 'validation'
  if (status === 401) return 'unauthorized'
  if (status === 403) return 'forbidden'
  if (status === 404) return 'not_found'
  if (status === 409) return 'conflict'
  if (status === 429) return 'rate_limited'
  if (status >= 500) return 'server'
  return 'unknown'
}

const FRIENDLY_MESSAGES: Record<ApiErrorKind, string> = {
  validation: 'Some information is missing or invalid. Please check the form and try again.',
  unauthorized: 'Your session has expired. Please log in again.',
  forbidden: "You don't have permission to do that.",
  not_found: 'We could not find what you were looking for.',
  conflict: 'This conflicts with existing data. Please refresh and try again.',
  rate_limited: 'Too many requests. Please wait a moment and try again.',
  server: 'Something went wrong on our end. Please try again shortly.',
  network: 'Unable to reach the server. Check your connection and try again.',
  unknown: 'Something unexpected happened. Please try again.',
}

// Curated copy for pg-backend error codes an owner/manager can realistically hit (verified against
// pg-backend common/constants/error-code.enum.ts and the services that throw them). These say what
// happened *and* what to do, which the generic per-status message can't.
export const ERROR_CODE_MESSAGES: Record<string, string> = {
  // Occupancy / check-in
  BED_ALREADY_OCCUPIED: 'That bed was just taken by another tenant. Pick a different bed and try again.',
  TENANT_ALREADY_ALLOCATED: 'This tenant already has an active or pending stay. Check out or cancel it first.',
  INVALID_RESIDENCY_STATE: 'This stay is no longer in a state that allows this action. Refresh to see its latest status.',
  INVALID_CHECKOUT: "This stay can't be checked out right now. Refresh to see its latest status.",
  PROPERTY_NOT_ACTIVE: 'This property is not active, so changes to it are blocked.',
  ROOM_NOT_ACTIVE: 'This room is not active. Reactivate it before adding beds or tenants.',
  BED_NOT_ACTIVE: 'This bed is not active. Choose an active bed.',
  ROOM_CAPACITY_EXCEEDED: 'This room is already at capacity. Increase its capacity before adding another bed.',
  ROOM_CAPACITY_BELOW_BED_COUNT: 'Capacity cannot be lower than the number of beds already in this room.',
  // Billing
  DUPLICATE_BILLING_PERIOD: 'An invoice already exists for this billing period.',
  INVALID_BILLING_PERIOD: 'That billing period is not valid for this stay.',
  INVALID_INVOICE_STATE: "This invoice's status changed. Refresh to see the latest version.",
  INVOICE_ALREADY_ISSUED: 'This invoice has already been issued.',
  INVOICE_ALREADY_VOID: 'This invoice has already been voided.',
  INVOICE_NOT_PAYABLE: 'This invoice cannot accept payments in its current status.',
  AMOUNT_EXCEEDS_OUTSTANDING_BALANCE: 'The amount is more than what is still owed on this invoice.',
  REFUND_NOT_ALLOWED: 'This payment cannot be refunded in its current status.',
  IDEMPOTENCY_KEY_CONFLICT: 'This request was already submitted. Refresh to see the result.',
  // Applications / visits
  VISIT_TIME_CONFLICT: 'Another visit is already scheduled at that time. Choose a different slot.',
  VISIT_INVALID_STATE: "This visit's status changed. Refresh to see the latest version.",
  APPLICATION_INVALID_STATE: "This application's status changed. Refresh to see the latest version.",
  APPLICATION_APPLICANT_NOT_LINKED: "This applicant hasn't linked a PGMet account yet, so onboarding can't start.",
  // Complaints
  COMPLAINT_INVALID_STATUS_TRANSITION: "The complaint can't move to that status from where it is now.",
  COMPLAINT_ASSIGNEE_NOT_IN_ORGANIZATION: 'That person is not a member of this organization.',
  COMPLAINT_ASSIGNMENT_NOT_ALLOWED: 'This complaint cannot be assigned right now.',
  // Generic unique-constraint conflict (Prisma P2002)
  CONFLICT: 'Something with these details already exists.',
  // Roles
  INSUFFICIENT_ROLE: "Your role in this organization doesn't allow this action.",
}

type BackendDetails = Array<{ field?: string; constraints?: Record<string, string> | string[] }>

function parseFieldErrors(details: unknown): Record<string, string[]> | null {
  if (!Array.isArray(details)) return null
  const result: Record<string, string[]> = {}
  for (const entry of details as BackendDetails) {
    if (!entry?.field || !entry.constraints) continue
    const messages = Array.isArray(entry.constraints) ? entry.constraints : Object.values(entry.constraints)
    if (messages.length > 0) result[entry.field] = messages.map(String)
  }
  return Object.keys(result).length > 0 ? result : null
}

function messageFor(kind: ApiErrorKind, code: string | null, backendMessage: string | undefined): string {
  if (code && ERROR_CODE_MESSAGES[code]) return ERROR_CODE_MESSAGES[code]
  // 400 messages are class-validator output and domain 409s are hand-written AppException messages,
  // both written for humans. 5xx and everything else never pass backend text through.
  if ((kind === 'validation' || kind === 'conflict') && backendMessage) return backendMessage
  return FRIENDLY_MESSAGES[kind]
}

/** Normalizes any thrown value (Axios error, network failure, etc.) into an ApiError. Never surfaces raw Nest/Prisma error bodies to the UI. */
export function normalizeError(error: unknown): ApiError {
  if (error instanceof ApiError) return error

  if (error instanceof AxiosError) {
    const status = error.response?.status
    const kind = kindFromStatus(status)

    if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT' || !error.response) {
      // Timeouts deliberately stay kind 'network': the auth layer treats any network-kind failure as
      // "session possibly still valid" and must not wipe the refresh token over a slow response.
      const timedOut = error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT'
      return new ApiError({
        message: timedOut ? 'The server took too long to respond. Please try again.' : FRIENDLY_MESSAGES.network,
        kind: 'network',
        status: null,
        code: timedOut ? 'TIMEOUT' : 'NETWORK',
      })
    }

    // pg-backend's AllExceptionsFilter always responds with
    // `{success: false, error: {code, message, details}, requestId}` — never a bare DTO.
    const body = error.response.data as
      | { success?: false; error?: { code?: string; message?: string | string[]; details?: unknown } }
      | undefined
    const backendError = body?.error
    const backendMessage = Array.isArray(backendError?.message)
      ? backendError.message.join(' ')
      : backendError?.message

    const code = backendError?.code ?? null

    return new ApiError({
      message: messageFor(kind, code, backendMessage),
      kind,
      status: status ?? null,
      code,
      fieldErrors: kind === 'validation' ? parseFieldErrors(backendError?.details) : null,
    })
  }

  return new ApiError({
    message: FRIENDLY_MESSAGES.unknown,
    kind: 'unknown',
    status: null,
  })
}
