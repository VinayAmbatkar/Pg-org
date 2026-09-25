import { z } from 'zod'

const dueDayField = z
  .string()
  .trim()
  .regex(/^\d{1,2}$/, 'Due day must be between 1 and 31')
  .refine((v) => Number(v) >= 1 && Number(v) <= 31, 'Due day must be between 1 and 31')

// Mirrors CreateRentPlanDto exactly — amount is a decimal string, dueDay 1-31 (kept as a string in
// the form and coerced to a number only at submit, so the resolver's input/output types stay aligned).
export const createRentPlanSchema = z.object({
  amount: z
    .string()
    .trim()
    .regex(/^\d{1,10}(\.\d{1,2})?$/, 'Enter a valid amount (e.g. 8500 or 8500.00)'),
  dueDay: dueDayField,
  effectiveFrom: z.string().min(1, 'Effective from date is required'),
})

export type CreateRentPlanFormValues = z.infer<typeof createRentPlanSchema>

export const updateRentPlanSchema = z.object({
  dueDay: dueDayField,
})

export type UpdateRentPlanFormValues = z.infer<typeof updateRentPlanSchema>
