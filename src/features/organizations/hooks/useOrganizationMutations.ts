import { useMutation, useQueryClient } from '@tanstack/react-query'
import { organizationsApi } from '../api/organizationsApi'
import { organizationKeys } from '../api/queryKeys'
import type { UpdateOrganizationPayload } from '../types'

export function useUpdateOrganization(id: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: UpdateOrganizationPayload) => organizationsApi.update(id, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: organizationKeys.lists() })
    },
  })
}
