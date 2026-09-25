import { z } from 'zod'

// Mirrors LoginDto (login.dto.ts): identifier is either email or phone, min length 3.
export const loginSchema = z.object({
  identifier: z.string().trim().min(3, 'Enter your email or phone number'),
  password: z.string().min(1, 'Password is required'),
})

export type LoginFormValues = z.infer<typeof loginSchema>
