import type { ListVisitsParams } from '../types'

export const visitKeys = {
  all: ['visits'] as const,
  listForProperty: (propertyId: string, params?: ListVisitsParams) => [...visitKeys.all, 'property', propertyId, params] as const,
  detail: (id: string) => [...visitKeys.all, 'detail', id] as const,
}
