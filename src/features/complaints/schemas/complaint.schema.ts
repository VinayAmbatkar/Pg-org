import { z } from 'zod'

// The backend has no org-member lookup endpoint (see docs/backend-gaps.md #3) — assignee is
// entered as a raw user ID, mirroring the same workaround used for residency creation.
export const assignSchema = z.object({
  assignedToUserId: z.string().trim().uuid('Enter a valid user ID (UUID)'),
})
export type AssignFormValues = z.infer<typeof assignSchema>

export const resolveSchema = z.object({
  resolutionNote: z.string().trim().min(3, 'Resolution note is required').max(2000, 'Resolution note must be 2000 characters or fewer'),
})
export type ResolveFormValues = z.infer<typeof resolveSchema>

export const commentSchema = z.object({
  body: z.string().trim().min(1, 'Comment cannot be empty').max(4000, 'Comment must be 4000 characters or fewer'),
  visibility: z.enum(['PUBLIC', 'INTERNAL']),
})
export type CommentFormValues = z.infer<typeof commentSchema>
