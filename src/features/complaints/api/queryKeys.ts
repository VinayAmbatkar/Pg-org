import type { ListComplaintsParams } from '../types'

export const complaintKeys = {
  all: ['complaints'] as const,
  list: (params: ListComplaintsParams) => [...complaintKeys.all, 'list', params] as const,
  detail: (id: string) => [...complaintKeys.all, 'detail', id] as const,
  activity: (id: string) => [...complaintKeys.all, 'activity', id] as const,
  comments: (id: string) => [...complaintKeys.all, 'comments', id] as const,
  attachments: (id: string) => [...complaintKeys.all, 'attachments', id] as const,
}
