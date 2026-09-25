import { z } from 'zod'

export const menuItemSchema = z.object({
  mealType: z.enum(['BREAKFAST', 'LUNCH', 'DINNER', 'SNACK', 'OTHER']),
  name: z.string().trim().min(1, 'Item name is required').max(200),
  description: z.string().trim().max(1000).optional().or(z.literal('')),
})
export type MenuItemFormValues = z.infer<typeof menuItemSchema>
