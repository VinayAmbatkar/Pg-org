import type { LucideIcon } from 'lucide-react'
import { AlertCircle, CheckCircle2, Clock, XCircle } from 'lucide-react'
import type {
  ApplicationStatus,
  ComplaintPriority,
  ComplaintStatus,
  FoodPlanStatus,
  FoodSubscriptionStatus,
  InvoiceStatus,
  MenuStatus,
  PaymentStatus,
  PropertyStatus,
  RentPlanStatus,
  ResidencyStatus,
  RoomStatus,
  VisitStatus,
} from '@/types/api'
import {
  APPLICATION_STATUS_LABELS,
  COMPLAINT_PRIORITY_LABELS,
  COMPLAINT_STATUS_LABELS,
  FOOD_PLAN_STATUS_LABELS,
  FOOD_SUBSCRIPTION_STATUS_LABELS,
  INVOICE_STATUS_LABELS,
  MENU_STATUS_LABELS,
  PAYMENT_STATUS_LABELS,
  PROPERTY_STATUS_LABELS,
  RENT_PLAN_STATUS_LABELS,
  RESIDENCY_STATUS_LABELS,
  VISIT_STATUS_LABELS,
} from '@/lib/formatters/enumLabels'

export type StatusVariant = 'success' | 'secondary' | 'outline' | 'warning' | 'destructive'

export interface StatusStyle {
  label: string
  variant: StatusVariant
  /** Extra non-colour cue for states that need attention or mark completion. */
  icon?: LucideIcon
}

type Variants<S extends string> = Record<S, StatusVariant>
type Icons<S extends string> = Partial<Record<S, LucideIcon>>

function domain<S extends string>(labels: Record<string, string>, variants: Variants<S>, icons: Icons<S> = {}) {
  return (status: S): StatusStyle => ({ label: labels[status] ?? status, variant: variants[status] ?? 'outline', icon: icons[status] })
}

/** Single source of truth for how every backend status renders. Labels live in enumLabels (also
 * used in filters); variants/icons live here. Add a status here, not an `if (status === ...)`. */
export const statusConfig = {
  application: domain<ApplicationStatus>(
    APPLICATION_STATUS_LABELS,
    {
      SUBMITTED: 'outline',
      UNDER_REVIEW: 'warning',
      VISIT_SCHEDULED: 'warning',
      APPROVED: 'success',
      REJECTED: 'destructive',
      WITHDRAWN: 'secondary',
      EXPIRED: 'secondary',
    },
    { APPROVED: CheckCircle2, REJECTED: XCircle },
  ),
  invoice: domain<InvoiceStatus>(
    INVOICE_STATUS_LABELS,
    { DRAFT: 'secondary', ISSUED: 'outline', OVERDUE: 'destructive', PARTIALLY_PAID: 'warning', PAID: 'success', VOID: 'secondary' },
    { OVERDUE: AlertCircle, PAID: CheckCircle2 },
  ),
  rentPlan: domain<RentPlanStatus>(RENT_PLAN_STATUS_LABELS, { ACTIVE: 'success', INACTIVE: 'secondary' }),
  complaint: domain<ComplaintStatus>(
    COMPLAINT_STATUS_LABELS,
    { OPEN: 'outline', ASSIGNED: 'warning', IN_PROGRESS: 'warning', RESOLVED: 'success', CLOSED: 'secondary', CANCELLED: 'secondary' },
    { RESOLVED: CheckCircle2 },
  ),
  complaintPriority: domain<ComplaintPriority>(
    COMPLAINT_PRIORITY_LABELS,
    { LOW: 'outline', MEDIUM: 'secondary', HIGH: 'warning', URGENT: 'destructive' },
    { URGENT: AlertCircle },
  ),
  foodPlan: domain<FoodPlanStatus>(FOOD_PLAN_STATUS_LABELS, { ACTIVE: 'success', INACTIVE: 'secondary', ARCHIVED: 'outline' }),
  foodSubscription: domain<FoodSubscriptionStatus>(FOOD_SUBSCRIPTION_STATUS_LABELS, {
    ACTIVE: 'success',
    PAUSED: 'warning',
    CANCELLED: 'secondary',
    EXPIRED: 'secondary',
  }),
  menu: domain<MenuStatus>(MENU_STATUS_LABELS, { DRAFT: 'outline', PUBLISHED: 'success', CANCELLED: 'secondary' }),
  payment: domain<PaymentStatus>(
    PAYMENT_STATUS_LABELS,
    {
      CREATED: 'outline',
      PENDING: 'outline',
      AUTHORIZED: 'warning',
      CAPTURED: 'success',
      FAILED: 'destructive',
      CANCELLED: 'secondary',
      REFUNDED: 'secondary',
      PARTIALLY_REFUNDED: 'warning',
    },
    { CAPTURED: CheckCircle2, FAILED: XCircle, PENDING: Clock },
  ),
  property: domain<PropertyStatus>(PROPERTY_STATUS_LABELS, { ACTIVE: 'success', INACTIVE: 'secondary', ARCHIVED: 'outline' }),
  room: domain<RoomStatus>(PROPERTY_STATUS_LABELS, { ACTIVE: 'success', INACTIVE: 'secondary', ARCHIVED: 'outline' }),
  residency: domain<ResidencyStatus>(RESIDENCY_STATUS_LABELS, {
    PENDING: 'outline',
    ACTIVE: 'success',
    NOTICE_PERIOD: 'warning',
    CHECKED_OUT: 'secondary',
  }),
  visit: domain<VisitStatus>(
    VISIT_STATUS_LABELS,
    { REQUESTED: 'outline', SCHEDULED: 'warning', COMPLETED: 'success', CANCELLED: 'secondary', NO_SHOW: 'destructive' },
    { NO_SHOW: AlertCircle },
  ),
} as const

export type StatusDomain = keyof typeof statusConfig
