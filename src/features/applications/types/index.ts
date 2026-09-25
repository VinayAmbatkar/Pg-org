import type { ApplicationStatus } from '@/types/api'

export interface RejectApplicationPayload {
  reason?: string
}

export interface ListApplicationsParams {
  page?: number
  limit?: number
  status?: ApplicationStatus
}
