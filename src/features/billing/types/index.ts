export interface CreateRentPlanPayload {
  amount: string
  dueDay: number
  effectiveFrom: string
  currency?: string
}

export interface UpdateRentPlanPayload {
  dueDay?: number
  deactivate?: boolean
}

export interface GenerateInvoicePayload {
  year: number
  month: number
}

export interface UpdateInvoicePayload {
  dueDate: string
}
