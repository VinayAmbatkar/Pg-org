import { z } from 'zod'

// Mirrors CreateResidencyDto exactly. Tenant ID is entered manually — pg-backend has no
// tenant search/lookup endpoint yet (see docs/backend-gaps.md).
export const createResidencySchema = z
  .object({
    tenantId: z.string().trim().uuid('Enter a valid Tenant ID (UUID)'),
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
