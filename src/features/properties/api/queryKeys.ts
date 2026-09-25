import type { ListPropertiesParams } from '../types'

export const propertyKeys = {
  all: ['properties'] as const,
  lists: () => [...propertyKeys.all, 'list'] as const,
  list: (params: ListPropertiesParams) => [...propertyKeys.lists(), params] as const,
  detail: (id: string) => [...propertyKeys.all, 'detail', id] as const,
}
