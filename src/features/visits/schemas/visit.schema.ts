import { z } from 'zod'

export const scheduleVisitSchema = z
  .object({
    scheduledStartAt: z.string().min(1, 'Start time is required'),
    scheduledEndAt: z.string().min(1, 'End time is required'),
    notes: z.string().trim().max(1000).optional().or(z.literal('')),
  })
  .refine((data) => data.scheduledEndAt > data.scheduledStartAt, {
    message: 'End time must be after start time',
    path: ['scheduledEndAt'],
  })
export type ScheduleVisitFormValues = z.infer<typeof scheduleVisitSchema>

export const rescheduleVisitSchema = z
  .object({
    scheduledStartAt: z.string().min(1, 'Start time is required'),
    scheduledEndAt: z.string().min(1, 'End time is required'),
  })
  .refine((data) => data.scheduledEndAt > data.scheduledStartAt, {
    message: 'End time must be after start time',
    path: ['scheduledEndAt'],
  })
export type RescheduleVisitFormValues = z.infer<typeof rescheduleVisitSchema>
