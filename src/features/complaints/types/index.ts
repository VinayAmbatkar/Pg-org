import type { ComplaintCategory, ComplaintCommentVisibility, ComplaintPriority, ComplaintStatus } from '@/types/api'

export interface ListComplaintsParams {
  page?: number
  limit?: number
  status?: ComplaintStatus
  priority?: ComplaintPriority
  category?: ComplaintCategory
  assignedToUserId?: string
  propertyId?: string
  roomId?: string
  createdFrom?: string
  createdTo?: string
  search?: string
  sortBy?: 'createdAt' | 'updatedAt' | 'priority' | 'status'
  sortDir?: 'asc' | 'desc'
}

export interface AssignComplaintPayload {
  assignedToUserId: string
}

export interface ResolveComplaintPayload {
  resolutionNote: string
}

export interface SetPriorityPayload {
  priority: ComplaintPriority
}

export interface CreateCommentPayload {
  body: string
  visibility?: ComplaintCommentVisibility
}

export interface CreateAttachmentPayload {
  url: string
  fileName: string
  mimeType: 'image/jpeg' | 'image/png' | 'image/webp'
  size: number
}
