import { apiClient } from '@/infrastructure/api/client'
import type { FoodConfiguration, FoodPlan, FoodSubscription, MealConsumption, Menu, MenuItem, PaginatedResult } from '@/types/api'
import type {
  CreateFoodPlanPayload,
  CreateMealConsumptionPayload,
  CreateMenuPayload,
  ListMealConsumptionsParams,
  ListMenusParams,
  MenuItemInput,
  UpdateFoodConfigurationPayload,
  UpdateFoodPlanPayload,
  UpdateMenuPayload,
  WeeklyMenuPayload,
} from '../types'

export const foodApi = {
  async getConfiguration(propertyId: string): Promise<FoodConfiguration> {
    const { data } = await apiClient.get<FoodConfiguration>(`/properties/${propertyId}/food`)
    return data
  },

  async updateConfiguration(propertyId: string, payload: UpdateFoodConfigurationPayload): Promise<FoodConfiguration> {
    const { data } = await apiClient.patch<FoodConfiguration>(`/properties/${propertyId}/food`, payload)
    return data
  },

  /** No pagination on this endpoint — returns every menu matching the filters. */
  async listMenus(propertyId: string, params: ListMenusParams): Promise<Menu[]> {
    const { data } = await apiClient.get<Menu[]>(`/properties/${propertyId}/food/menus`, { params })
    return data
  },

  async createMenu(propertyId: string, payload: CreateMenuPayload): Promise<Menu> {
    const { data } = await apiClient.post<Menu>(`/properties/${propertyId}/food/menus`, payload)
    return data
  },

  async putWeeklyMenu(propertyId: string, payload: WeeklyMenuPayload): Promise<Menu[]> {
    const { data } = await apiClient.put<Menu[]>(`/properties/${propertyId}/food/menus/week`, payload)
    return data
  },

  async getMenu(id: string): Promise<Menu> {
    const { data } = await apiClient.get<Menu>(`/food/menus/${id}`)
    return data
  },

  async updateMenu(id: string, payload: UpdateMenuPayload): Promise<Menu> {
    const { data } = await apiClient.patch<Menu>(`/food/menus/${id}`, payload)
    return data
  },

  async publishMenu(id: string): Promise<Menu> {
    const { data } = await apiClient.post<Menu>(`/food/menus/${id}/publish`)
    return data
  },

  async cancelMenu(id: string): Promise<Menu> {
    const { data } = await apiClient.post<Menu>(`/food/menus/${id}/cancel`)
    return data
  },

  async addMenuItem(menuId: string, payload: MenuItemInput): Promise<MenuItem> {
    const { data } = await apiClient.post<MenuItem>(`/food/menus/${menuId}/items`, payload)
    return data
  },

  async removeMenuItem(itemId: string): Promise<void> {
    await apiClient.delete(`/food/menu-items/${itemId}`)
  },

  async listPlans(propertyId: string): Promise<FoodPlan[]> {
    const { data } = await apiClient.get<FoodPlan[]>(`/properties/${propertyId}/food/plans`)
    return data
  },

  async createPlan(propertyId: string, payload: CreateFoodPlanPayload): Promise<FoodPlan> {
    const { data } = await apiClient.post<FoodPlan>(`/properties/${propertyId}/food/plans`, payload)
    return data
  },

  async updatePlan(id: string, payload: UpdateFoodPlanPayload): Promise<FoodPlan> {
    const { data } = await apiClient.patch<FoodPlan>(`/food/plans/${id}`, payload)
    return data
  },

  async archivePlan(id: string): Promise<FoodPlan> {
    const { data } = await apiClient.post<FoodPlan>(`/food/plans/${id}/archive`)
    return data
  },

  /** No pagination on this endpoint — returns every subscription for the property. */
  async listSubscriptions(propertyId: string): Promise<FoodSubscription[]> {
    const { data } = await apiClient.get<FoodSubscription[]>(`/properties/${propertyId}/food/subscriptions`)
    return data
  },

  async listMealConsumptions(propertyId: string, params: ListMealConsumptionsParams): Promise<PaginatedResult<MealConsumption>> {
    const { data } = await apiClient.get<PaginatedResult<MealConsumption>>(`/properties/${propertyId}/food/meal-consumptions`, { params })
    return data
  },

  async recordMealConsumption(propertyId: string, payload: CreateMealConsumptionPayload): Promise<MealConsumption> {
    const { data } = await apiClient.post<MealConsumption>(`/properties/${propertyId}/food/meal-consumptions`, payload)
    return data
  },
}
