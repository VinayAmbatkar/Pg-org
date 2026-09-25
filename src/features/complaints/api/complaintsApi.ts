import { apiClient } from '@/infrastructure/api/client'
import type { Complaint, ComplaintActivity, ComplaintAttachment, ComplaintComment, PaginatedResult } from '@/types/api'
import type {
  AssignComplaintPayload,
  CreateAttachmentPayload,
  CreateCommentPayload,
  ListComplaintsParams,
  ResolveComplaintPayload,
  SetPriorityPayload,
} from '../types'

export const complaintsApi = {
  async list(params: ListComplaintsParams): Promise<PaginatedResult<Complaint>> {
    const { data } = await apiClient.get<PaginatedResult<Complaint>>('/complaints', { params })
    return data
  },

  async get(id: string): Promise<Complaint> {
    const { data } = await apiClient.get<Complaint>(`/complaints/${id}`)
    return data
  },

  async getActivity(id: string): Promise<ComplaintActivity[]> {
    const { data } = await apiClient.get<ComplaintActivity[]>(`/complaints/${id}/activity`)
    return data
  },

  async listComments(id: string): Promise<ComplaintComment[]> {
    const { data } = await apiClient.get<ComplaintComment[]>(`/complaints/${id}/comments`)
    return data
  },

  async addComment(id: string, payload: CreateCommentPayload): Promise<ComplaintComment> {
    const { data } = await apiClient.post<ComplaintComment>(`/complaints/${id}/comments`, payload)
    return data
  },

  async listAttachments(id: string): Promise<ComplaintAttachment[]> {
    const { data } = await apiClient.get<ComplaintAttachment[]>(`/complaints/${id}/attachments`)
    return data
  },

  async addAttachment(id: string, payload: CreateAttachmentPayload): Promise<ComplaintAttachment> {
    const { data } = await apiClient.post<ComplaintAttachment>(`/complaints/${id}/attachments`, payload)
    return data
  },

  async removeAttachment(id: string, attachmentId: string): Promise<void> {
    await apiClient.delete(`/complaints/${id}/attachments/${attachmentId}`)
  },

  async assign(id: string, payload: AssignComplaintPayload): Promise<Complaint> {
    const { data } = await apiClient.post<Complaint>(`/complaints/${id}/assign`, payload)
    return data
  },

  async unassign(id: string): Promise<Complaint> {
    const { data } = await apiClient.post<Complaint>(`/complaints/${id}/unassign`)
    return data
  },

  async start(id: string): Promise<Complaint> {
    const { data } = await apiClient.post<Complaint>(`/complaints/${id}/start`)
    return data
  },

  async resolve(id: string, payload: ResolveComplaintPayload): Promise<Complaint> {
    const { data } = await apiClient.post<Complaint>(`/complaints/${id}/resolve`, payload)
    return data
  },

  async close(id: string): Promise<Complaint> {
    const { data } = await apiClient.post<Complaint>(`/complaints/${id}/close`)
    return data
  },

  async cancel(id: string): Promise<Complaint> {
    const { data } = await apiClient.post<Complaint>(`/complaints/${id}/cancel`)
    return data
  },

  async setPriority(id: string, payload: SetPriorityPayload): Promise<Complaint> {
    const { data } = await apiClient.post<Complaint>(`/complaints/${id}/priority`, payload)
    return data
  },
}
