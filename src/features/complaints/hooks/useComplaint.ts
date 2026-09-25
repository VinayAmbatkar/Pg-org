import { useQuery } from '@tanstack/react-query'
import { complaintsApi } from '../api/complaintsApi'
import { complaintKeys } from '../api/queryKeys'

export function useComplaint(id: string | undefined) {
  return useQuery({
    queryKey: complaintKeys.detail(id ?? ''),
    queryFn: () => complaintsApi.get(id!),
    enabled: Boolean(id),
  })
}

export function useComplaintActivity(id: string | undefined) {
  return useQuery({
    queryKey: complaintKeys.activity(id ?? ''),
    queryFn: () => complaintsApi.getActivity(id!),
    enabled: Boolean(id),
  })
}

export function useComplaintComments(id: string | undefined) {
  return useQuery({
    queryKey: complaintKeys.comments(id ?? ''),
    queryFn: () => complaintsApi.listComments(id!),
    enabled: Boolean(id),
  })
}

export function useComplaintAttachments(id: string | undefined) {
  return useQuery({
    queryKey: complaintKeys.attachments(id ?? ''),
    queryFn: () => complaintsApi.listAttachments(id!),
    enabled: Boolean(id),
  })
}
