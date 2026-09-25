import { z } from 'zod'

// Mirrors CreatePropertyDto/UpdatePropertyDto exactly (create-property.dto.ts / update-property.dto.ts).
export const propertyFormSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(150),
  propertyType: z.enum(['PG', 'HOSTEL', 'CO_LIVING', 'STUDENT_HOUSING']),
  addressLine1: z.string().trim().min(2, 'Address is required').max(200),
  addressLine2: z.union([z.literal(''), z.string().trim().max(200)]).optional(),
  city: z.string().trim().min(1, 'City is required').max(100),
  state: z.string().trim().min(1, 'State is required').max(100),
  postalCode: z.string().trim().min(3, 'Postal code is required').max(12),
})

export type PropertyFormValues = z.infer<typeof propertyFormSchema>
