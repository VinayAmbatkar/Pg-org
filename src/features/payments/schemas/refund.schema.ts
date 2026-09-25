import { z } from 'zod'

// Mirrors RefundPaymentDto exactly — both fields optional (omitted amount means "full refund").
export const refundSchema = z.object({
  amount: z
    .string()
    .trim()
    .regex(/^\d{1,10}(\.\d{1,2})?$/, 'Enter a valid amount (e.g. 500 or 500.00)')
    .optional()
    .or(z.literal('')),
  reason: z.string().trim().max(500, 'Reason must be 500 characters or fewer').optional(),
})

export type RefundFormValues = z.infer<typeof refundSchema>
