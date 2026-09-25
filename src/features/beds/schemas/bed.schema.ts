import { z } from 'zod'

// '' = a regular (non-bunk) bed; LOWER/UPPER = bunk position (pg-backend BedBerth).
const berth = z.enum(['', 'LOWER', 'UPPER'])

// Mirrors CreateBedDto exactly (create-bed.dto.ts) — roomId/propertyId come from the URL.
export const bedFormSchema = z.object({
  bedNumber: z.string().trim().min(1, 'Bed number is required').max(20, 'Keep bed numbers to 20 characters'),
  berth,
})

export type BedFormValues = z.infer<typeof bedFormSchema>

// Mirrors UpdateBedDto exactly — status is restricted to AVAILABLE | INACTIVE (archiving is DELETE-only).
export const bedEditFormSchema = z.object({
  bedNumber: z.string().trim().min(1, 'Bed number is required').max(20, 'Keep bed numbers to 20 characters'),
  status: z.enum(['AVAILABLE', 'INACTIVE']),
  berth,
})

export type BedEditFormValues = z.infer<typeof bedEditFormSchema>
