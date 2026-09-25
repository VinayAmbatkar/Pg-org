import { z } from 'zod'

const mealTypeEnum = z.enum(['BREAKFAST', 'LUNCH', 'DINNER', 'SNACK', 'OTHER'])

// Mirrors CreateFoodPlanDto — price/currency/billingCycle are immutable after creation.
export const createFoodPlanSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(200),
  description: z.string().trim().max(2000).optional().or(z.literal('')),
  price: z
    .string()
    .trim()
    .regex(/^\d{1,10}(\.\d{1,2})?$/, 'Enter a valid price (e.g. 3000 or 3000.00)'),
  mealTypes: z.array(mealTypeEnum).min(1, 'Select at least one meal type'),
})
export type CreateFoodPlanFormValues = z.infer<typeof createFoodPlanSchema>

// Mirrors UpdateFoodPlanDto — name/description/mealTypes only.
export const updateFoodPlanSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(200),
  description: z.string().trim().max(2000).optional().or(z.literal('')),
  mealTypes: z.array(mealTypeEnum).min(1, 'Select at least one meal type'),
})
export type UpdateFoodPlanFormValues = z.infer<typeof updateFoodPlanSchema>
