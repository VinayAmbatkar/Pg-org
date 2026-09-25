import type { ListApplicationsParams } from '../types'

export const applicationKeys = {
  all: ['applications'] as const,
  listForProperty: (propertyId: string, params?: ListApplicationsParams) =>
    [...applicationKeys.all, 'property', propertyId, params] as const,
  detail: (id: string) => [...applicationKeys.all, 'detail', id] as const,
}
