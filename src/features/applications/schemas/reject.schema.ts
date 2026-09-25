import { z } from 'zod'

export const rejectSchema = z.object({
  reason: z.string().trim().max(1000, 'Reason must be 1000 characters or fewer').optional(),
})
export type RejectFormValues = z.infer<typeof rejectSchema>
