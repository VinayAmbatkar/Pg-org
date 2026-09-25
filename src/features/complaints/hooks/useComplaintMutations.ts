import { useMutation, useQueryClient, type QueryClient } from '@tanstack/react-query'
import { complaintsApi } from '../api/complaintsApi'
import { complaintKeys } from '../api/queryKeys'
import type {
  AssignComplaintPayload,
  CreateAttachmentPayload,
  CreateCommentPayload,
  ResolveComplaintPayload,
  SetPriorityPayload,
} from '../types'
import type { Complaint } from '@/types/api'

function afterAction(queryClient: QueryClient, id: string, complaint: Complaint) {
  queryClient.setQueryData(complaintKeys.detail(id), complaint)
  void queryClient.invalidateQueries({ queryKey: complaintKeys.activity(id) })
  void queryClient.invalidateQueries({ queryKey: [...complaintKeys.all, 'list'] })
}

export function useAssignComplaint(id: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: AssignComplaintPayload) => complaintsApi.assign(id, payload),
    onSuccess: (complaint) => afterAction(queryClient, id, complaint),
  })
}

export function useUnassignComplaint(id: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => complaintsApi.unassign(id),
    onSuccess: (complaint) => afterAction(queryClient, id, complaint),
  })
}

export function useStartComplaint(id: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => complaintsApi.start(id),
    onSuccess: (complaint) => afterAction(queryClient, id, complaint),
  })
}

export function useResolveComplaint(id: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: ResolveComplaintPayload) => complaintsApi.resolve(id, payload),
    onSuccess: (complaint) => afterAction(queryClient, id, complaint),
  })
}

export function useCloseComplaint(id: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => complaintsApi.close(id),
    onSuccess: (complaint) => afterAction(queryClient, id, complaint),
  })
}

export function useCancelComplaint(id: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => complaintsApi.cancel(id),
    onSuccess: (complaint) => afterAction(queryClient, id, complaint),
  })
}

export function useSetComplaintPriority(id: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: SetPriorityPayload) => complaintsApi.setPriority(id, payload),
    onSuccess: (complaint) => afterAction(queryClient, id, complaint),
  })
}

export function useAddComplaintComment(id: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateCommentPayload) => complaintsApi.addComment(id, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: complaintKeys.comments(id) })
      void queryClient.invalidateQueries({ queryKey: complaintKeys.activity(id) })
    },
  })
}

export function useAddComplaintAttachment(id: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateAttachmentPayload) => complaintsApi.addAttachment(id, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: complaintKeys.attachments(id) })
    },
  })
}

export function useRemoveComplaintAttachment(id: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (attachmentId: string) => complaintsApi.removeAttachment(id, attachmentId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: complaintKeys.attachments(id) })
    },
  })
}
