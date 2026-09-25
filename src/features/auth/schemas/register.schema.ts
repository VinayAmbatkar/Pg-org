import { z } from 'zod'

// Mirrors RegisterDto in pg-backend exactly (register.dto.ts): name/password required,
// email and phone both optional at the DTO level but the service rejects a request with
// neither present (400 VALIDATION_FAILED) — enforced here via refine so the user sees it
// before submitting instead of round-tripping to the server.
export const registerSchema = z
  .object({
    name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100),
    email: z.union([z.literal(''), z.string().trim().email('Enter a valid email address')]).optional(),
    phone: z
      .union([z.literal(''), z.string().trim().regex(/^\+?[1-9]\d{7,14}$/, 'Enter a valid phone number')])
      .optional(),
    password: z.string().min(8, 'Password must be at least 8 characters').max(128),
  })
  .refine((data) => Boolean(data.email) || Boolean(data.phone), {
    message: 'Provide an email or a phone number',
    path: ['email'],
  })

export type RegisterFormValues = z.infer<typeof registerSchema>
