export const PROPERTY_TYPE_LABELS: Record<string, string> = {
  PG: 'PG',
  HOSTEL: 'Hostel',
  CO_LIVING: 'Co-living',
  STUDENT_HOUSING: 'Student housing',
}

export const PROPERTY_STATUS_LABELS: Record<string, string> = {
  ACTIVE: 'Active',
  INACTIVE: 'Inactive',
  ARCHIVED: 'Archived',
}

export const ROOM_TYPE_LABELS: Record<string, string> = {
  SINGLE: 'Single',
  DOUBLE: 'Double',
  TRIPLE: 'Triple',
  FOUR: 'Four-sharing',
  DORMITORY: 'Dormitory',
  OTHER: 'Other',
}

export const BED_STATUS_LABELS: Record<string, string> = {
  AVAILABLE: 'Available',
  INACTIVE: 'Inactive',
  ARCHIVED: 'Archived',
}

export const RESIDENCY_STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pending check-in',
  ACTIVE: 'Active',
  NOTICE_PERIOD: 'Notice period',
  CHECKED_OUT: 'Checked out',
}

export const RENT_PLAN_STATUS_LABELS: Record<string, string> = {
  ACTIVE: 'Active',
  INACTIVE: 'Inactive',
}

export const INVOICE_STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Draft',
  ISSUED: 'Issued',
  OVERDUE: 'Overdue',
  PARTIALLY_PAID: 'Partially paid',
  PAID: 'Paid',
  VOID: 'Void',
}

export const PAYMENT_STATUS_LABELS: Record<string, string> = {
  CREATED: 'Created',
  PENDING: 'Pending',
  AUTHORIZED: 'Authorized',
  CAPTURED: 'Captured',
  FAILED: 'Failed',
  CANCELLED: 'Cancelled',
  REFUNDED: 'Refunded',
  PARTIALLY_REFUNDED: 'Partially refunded',
}

export const COMPLAINT_STATUS_LABELS: Record<string, string> = {
  OPEN: 'Open',
  ASSIGNED: 'Assigned',
  IN_PROGRESS: 'In progress',
  RESOLVED: 'Resolved',
  CLOSED: 'Closed',
  CANCELLED: 'Cancelled',
}

export const COMPLAINT_PRIORITY_LABELS: Record<string, string> = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
  URGENT: 'Urgent',
}

export const COMPLAINT_CATEGORY_LABELS: Record<string, string> = {
  PLUMBING: 'Plumbing',
  ELECTRICAL: 'Electrical',
  WIFI: 'Wi-Fi',
  CLEANING: 'Cleaning',
  ROOM: 'Room',
  BED: 'Bed',
  FURNITURE: 'Furniture',
  FOOD: 'Food',
  SECURITY: 'Security',
  MAINTENANCE: 'Maintenance',
  OTHER: 'Other',
}

export const MEAL_TYPE_LABELS: Record<string, string> = {
  BREAKFAST: 'Breakfast',
  LUNCH: 'Lunch',
  DINNER: 'Dinner',
  SNACK: 'Snack',
  OTHER: 'Other',
}

export const MENU_STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Draft',
  PUBLISHED: 'Published',
  CANCELLED: 'Cancelled',
}

export const FOOD_PLAN_STATUS_LABELS: Record<string, string> = {
  ACTIVE: 'Active',
  INACTIVE: 'Inactive',
  ARCHIVED: 'Archived',
}

export const FOOD_SUBSCRIPTION_STATUS_LABELS: Record<string, string> = {
  ACTIVE: 'Active',
  PAUSED: 'Paused',
  CANCELLED: 'Cancelled',
  EXPIRED: 'Expired',
}

export const APPLICATION_STATUS_LABELS: Record<string, string> = {
  SUBMITTED: 'Submitted',
  UNDER_REVIEW: 'Under review',
  VISIT_SCHEDULED: 'Visit scheduled',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  WITHDRAWN: 'Withdrawn',
  EXPIRED: 'Expired',
}

export const VISIT_STATUS_LABELS: Record<string, string> = {
  REQUESTED: 'Requested',
  SCHEDULED: 'Scheduled',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
  NO_SHOW: 'No-show',
}

export function humanizeEnum(value: string): string {
  return value
    .toLowerCase()
    .split('_')
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join(' ')
}
