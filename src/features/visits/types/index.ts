export interface ListVisitsParams {
  page?: number
  limit?: number
}

export interface ScheduleVisitPayload {
  scheduledStartAt: string
  scheduledEndAt: string
  notes?: string
}

export interface RescheduleVisitPayload {
  scheduledStartAt: string
  scheduledEndAt: string
}
