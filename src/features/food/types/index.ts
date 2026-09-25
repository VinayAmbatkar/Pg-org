import type { BillingCycle, MealType, MenuStatus } from '@/types/api'

export interface UpdateFoodConfigurationPayload {
  enabled?: boolean
  mealsIncludedInRent?: boolean
  includedMealTypes?: MealType[]
  optionalSubscriptionEnabled?: boolean
}

export interface MenuItemInput {
  mealType: MealType
  name: string
  description?: string
  isVegetarian?: boolean
  isAvailable?: boolean
}

export interface CreateMenuPayload {
  date: string
  items?: MenuItemInput[]
}

export interface UpdateMenuPayload {
  items: MenuItemInput[]
}

export interface ListMenusParams {
  status?: MenuStatus
  from?: string
  to?: string
}

export interface WeeklyMenuDay {
  date: string
  items: MenuItemInput[]
}

export interface WeeklyMenuPayload {
  days: WeeklyMenuDay[]
}

export interface CreateFoodPlanPayload {
  name: string
  description?: string
  billingCycle?: BillingCycle
  price: string
  currency?: string
  mealTypes: MealType[]
}

export interface UpdateFoodPlanPayload {
  name?: string
  description?: string
  mealTypes?: MealType[]
}

export interface ListMealConsumptionsParams {
  residencyId?: string
  from?: string
  to?: string
  page?: number
  limit?: number
}

export interface CreateMealConsumptionPayload {
  residencyId: string
  mealType: MealType
  mealDate: string
  menuId?: string
}
