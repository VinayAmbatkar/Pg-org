import { z } from 'zod'

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
// Loose on purpose (case, spaces, optional "TN-", look-alike O/I/L) - the backend normalizes and
// validates it in GET /tenants/lookup.
const TENANT_CODE_PATTERN = /^(tn)?[0-9a-z]{8}$/i

export const isTenantUuid = (value: string) => UUID_PATTERN.test(value.trim())
export const isTenantCode = (value: string) => TENANT_CODE_PATTERN.test(value.replace(/[\s-]/g, ''))

// Mirrors CreateResidencyDto, except the tenant is entered as the short tenant code the tenant
// shares (TN-3K7Q-9XZ2) or, as a fallback, the full tenant ID. The page resolves it to a
// tenantId (GET /tenants/lookup) before calling POST /residencies.
export const createResidencySchema = z
  .object({
    tenantRef: z
      .string()
      .trim()
      .min(1, 'Enter the tenant code, e.g. TN-3K7Q-9XZ2')
      .refine((v) => isTenantCode(v) || isTenantUuid(v), 'Enter a tenant code like TN-3K7Q-9XZ2 (or the full tenant ID)'),
    startDate: z.string().min(1, 'Start date is required'),
    expectedEndDate: z.string().optional(),
  })
  .refine((data) => !data.expectedEndDate || data.expectedEndDate >= data.startDate, {
    message: 'Expected end date cannot be before the start date',
    path: ['expectedEndDate'],
  })

export type CreateResidencyFormValues = z.infer<typeof createResidencySchema>

export const checkInSchema = z.object({
  bedId: z.string().trim().uuid('Select a bed'),
})

export type CheckInFormValues = z.infer<typeof checkInSchema>
