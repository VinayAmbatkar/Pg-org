import type { PropertyType } from '@/types/api'

export interface CreatePropertyPayload {
  organizationId: string
  name: string
  propertyType?: PropertyType
  addressLine1: string
  addressLine2?: string
  city: string
  state: string
  postalCode: string
}

export type UpdatePropertyPayload = Partial<Omit<CreatePropertyPayload, 'organizationId'>>

export interface ListPropertiesParams {
  organizationId?: string
}
