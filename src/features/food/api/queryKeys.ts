export const foodKeys = {
  all: ['food'] as const,
  configuration: (propertyId: string) => [...foodKeys.all, 'configuration', propertyId] as const,
  menus: (propertyId: string, params?: unknown) => [...foodKeys.all, 'menus', propertyId, params] as const,
  weeklyMenu: (propertyId: string, weekStart: string) => [...foodKeys.all, 'weekly-menu', propertyId, weekStart] as const,
  menuDetail: (id: string) => [...foodKeys.all, 'menu-detail', id] as const,
  plans: (propertyId: string) => [...foodKeys.all, 'plans', propertyId] as const,
  planDetail: (id: string) => [...foodKeys.all, 'plan-detail', id] as const,
  subscriptions: (propertyId: string) => [...foodKeys.all, 'subscriptions', propertyId] as const,
  subscriptionDetail: (id: string) => [...foodKeys.all, 'subscription-detail', id] as const,
  mealConsumptions: (propertyId: string, params?: unknown) => [...foodKeys.all, 'meal-consumptions', propertyId, params] as const,
}
