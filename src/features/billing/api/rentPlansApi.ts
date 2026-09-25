import { apiClient } from '@/infrastructure/api/client'
import { ApiError } from '@/infrastructure/api/errors'
import type { RentPlan } from '@/types/api'
import type { CreateRentPlanPayload, UpdateRentPlanPayload } from '../types'

export const rentPlansApi = {
  /** The current ACTIVE plan only — the backend exposes no endpoint for a residency's full rent-plan
   * history (see docs/backend-gaps.md). */
  async getCurrentForResidency(residencyId: string): Promise<RentPlan | null> {
    try {
      const { data } = await apiClient.get<RentPlan>(`/residencies/${residencyId}/rent-plan`)
      return data
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) {
        return null
      }
      throw error
    }
  },

  async create(residencyId: string, payload: CreateRentPlanPayload): Promise<RentPlan> {
    const { data } = await apiClient.post<RentPlan>(`/residencies/${residencyId}/rent-plan`, payload)
    return data
  },

  async update(id: string, payload: UpdateRentPlanPayload): Promise<RentPlan> {
    const { data } = await apiClient.patch<RentPlan>(`/rent-plans/${id}`, payload)
    return data
  },
}
