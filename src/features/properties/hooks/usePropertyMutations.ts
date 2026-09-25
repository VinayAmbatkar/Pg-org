import { useMutation, useQueryClient } from '@tanstack/react-query'
import { propertiesApi } from '../api/propertiesApi'
import { propertyKeys } from '../api/queryKeys'
import type { CreatePropertyPayload, UpdatePropertyPayload } from '../types'

export function useCreateProperty() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreatePropertyPayload) => propertiesApi.create(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: propertyKeys.lists() })
    },
  })
}

export function useUpdateProperty(id: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: UpdatePropertyPayload) => propertiesApi.update(id, payload),
    onSuccess: (property) => {
      queryClient.setQueryData(propertyKeys.detail(id), property)
      void queryClient.invalidateQueries({ queryKey: propertyKeys.lists() })
    },
  })
}

export function useArchiveProperty() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => propertiesApi.archive(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: propertyKeys.lists() })
    },
  })
}
