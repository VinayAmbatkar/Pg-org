export interface CreateResidencyPayload {
  tenantId: string
  startDate: string
  expectedEndDate?: string
}

export interface UpdateResidencyPayload {
  expectedEndDate: string
}

export interface CheckInPayload {
  bedId: string
}
