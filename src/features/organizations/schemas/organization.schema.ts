import { z } from 'zod'

// Mirrors CreateOrganizationDto/UpdateOrganizationDto exactly — name is the only field.
export const organizationFormSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(150),
})

export type OrganizationFormValues = z.infer<typeof organizationFormSchema>
