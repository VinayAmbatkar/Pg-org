import { useQuery } from '@tanstack/react-query'
import { complaintsApi } from '../api/complaintsApi'
import { complaintKeys } from '../api/queryKeys'
import type { ListComplaintsParams } from '../types'

export function useComplaints(params: ListComplaintsParams, { enabled = true }: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: complaintKeys.list(params),
    queryFn: () => complaintsApi.list(params),
    enabled,
  })
}
