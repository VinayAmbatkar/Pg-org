// Enums mirrored exactly from the pg-backend Prisma schema / DTOs.
// Do not add values here that the backend does not actually return.

export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED'
export type PlatformRole = 'SUPER_ADMIN' | 'USER'

export type MembershipRole = 'OWNER' | 'MANAGER' | 'STAFF' | 'STUDENT'
export type OrganizationStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED'

export type PropertyType = 'PG' | 'HOSTEL' | 'CO_LIVING' | 'STUDENT_HOUSING'
export type PropertyStatus = 'ACTIVE' | 'INACTIVE' | 'ARCHIVED'

export type RoomType = 'SINGLE' | 'DOUBLE' | 'TRIPLE' | 'FOUR' | 'DORMITORY' | 'OTHER'
export type RoomStatus = 'ACTIVE' | 'INACTIVE' | 'ARCHIVED'

export type BedStatus = 'AVAILABLE' | 'INACTIVE' | 'ARCHIVED'

export type ResidencyStatus = 'PENDING' | 'ACTIVE' | 'NOTICE_PERIOD' | 'CHECKED_OUT'
export type BedAllocationStatus = 'ACTIVE' | 'ENDED' | 'CANCELLED'

export type NotificationPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT'

export interface User {
  id: string
  name: string
  email: string | null
  phone: string | null
  status: UserStatus
  platformRole: PlatformRole
}

export interface AuthTokens {
  accessToken: string
  refreshToken: string
  expiresIn: number
  tokenType: string
}

export interface Organization {
  id: string
  name: string
  status: OrganizationStatus
  yourRole: MembershipRole | null
  createdAt: string
}

export interface Property {
  id: string
  organizationId: string
  name: string
  propertyType: PropertyType
  addressLine1: string
  addressLine2: string | null
  city: string
  state: string
  postalCode: string
  status: PropertyStatus
  createdAt: string
}

// In-room features (pg-backend RoomAmenity). "Non-AC" is the absence of AC, not a value.
export type RoomAmenity = 'AC' | 'WIFI' | 'TV' | 'FAN' | 'ALMARI' | 'STUDY_TABLE' | 'ATTACHED_WASHROOM' | 'GEYSER' | 'BALCONY'
export type BedBerth = 'LOWER' | 'UPPER'

/** Server-computed from non-archived beds and their ACTIVE allocations (exact). */
export interface RoomOccupancy {
  totalBeds: number
  occupiedBeds: number
  /** In service (AVAILABLE) and unoccupied. */
  vacantBeds: number
  /** Out of service (INACTIVE) and unoccupied. */
  blockedBeds: number
}

export interface Room {
  id: string
  propertyId: string
  roomNumber: string
  floor: number | null
  roomType: RoomType
  capacity: number
  status: RoomStatus
  /** Advertised monthly price per bed (decimal string). A tenant is billed by their own rent plan. */
  pricePerBed: string | null
  currency: string
  amenities: RoomAmenity[]
  imageUrl: string | null
  description: string | null
  occupancy: RoomOccupancy
  createdAt: string
}

export interface BedOccupant {
  residencyId: string
  tenantId: string
  name: string
  phone: string | null
  /** Check-in date of the current allocation. */
  since: string
  monthlyRent: string | null
  currency: string | null
}

export interface Bed {
  id: string
  roomId: string
  bedNumber: string
  status: BedStatus
  berth: BedBerth | null
  /** Who is in the bed now (ACTIVE allocation), or null. */
  occupant: BedOccupant | null
  createdAt: string
}

export interface RoomHistoryEntry {
  allocationId: string
  bedId: string
  bedNumber: string
  residencyId: string
  tenantId: string
  tenantName: string
  startDate: string
  endDate: string | null
  status: BedAllocationStatus
}

export interface Tenant {
  id: string
  userId: string
  createdAt: string
}

export interface Residency {
  id: string
  tenantId: string
  propertyId: string
  startDate: string
  expectedEndDate: string | null
  actualEndDate: string | null
  status: ResidencyStatus
  createdAt: string
}

export interface BedAllocation {
  id: string
  residencyId: string
  bedId: string
  startDate: string
  endDate: string | null
  status: BedAllocationStatus
  createdAt: string
}

export interface ResidencyActionResult {
  residency: Residency
  allocation: BedAllocation
}

export interface AppNotification {
  id: string
  type: string
  title: string
  body: string
  priority: NotificationPriority
  data: Record<string, unknown> | null
  isRead: boolean
  readAt: string | null
  createdAt: string
}

export interface PaginatedResult<T> {
  items: T[]
  total: number
  page: number
  limit: number
}

// ---------------------------------------------------------------------------
// Billing: rent plans & invoices
// ---------------------------------------------------------------------------

export type RentPlanStatus = 'ACTIVE' | 'INACTIVE'
export type BillingCycle = 'MONTHLY'

export interface RentPlan {
  id: string
  residencyId: string
  amount: string
  currency: string
  billingCycle: BillingCycle
  dueDay: number
  effectiveFrom: string
  effectiveTo: string | null
  status: RentPlanStatus
  createdAt: string
}

export type InvoiceStatus = 'DRAFT' | 'ISSUED' | 'OVERDUE' | 'PARTIALLY_PAID' | 'PAID' | 'VOID'
export type InvoiceItemType = 'RENT'

export interface InvoiceItem {
  id: string
  description: string
  itemType: InvoiceItemType
  quantity: number
  unitAmount: string
  amount: string
}

export interface Invoice {
  id: string
  residencyId: string
  invoiceNumber: string
  billingPeriodStart: string
  billingPeriodEnd: string
  issueDate: string | null
  dueDate: string
  subtotal: string
  discount: string
  tax: string
  total: string
  currency: string
  status: InvoiceStatus
  createdAt: string
  items?: InvoiceItem[]
}

// ---------------------------------------------------------------------------
// Payments
// ---------------------------------------------------------------------------

export type PaymentStatus =
  | 'CREATED'
  | 'PENDING'
  | 'AUTHORIZED'
  | 'CAPTURED'
  | 'FAILED'
  | 'CANCELLED'
  | 'REFUNDED'
  | 'PARTIALLY_REFUNDED'
export type SettlementStatus = 'PENDING' | 'PROCESSING' | 'SETTLED' | 'FAILED' | 'REVERSED'

export interface OwnerSettlementSummary {
  status: SettlementStatus
  settlementAmount: string
  platformFee: string
  settledAt: string | null
}

export interface Payment {
  id: string
  organizationId: string
  propertyId: string
  residencyId: string
  invoiceId: string
  payerUserId: string
  amount: string
  currency: string
  platformFee: string
  ownerSettlementAmount: string
  method: string | null
  status: PaymentStatus
  provider: string
  providerOrderId: string | null
  providerPaymentId: string | null
  failureCode: string | null
  failureMessage: string | null
  paidAt: string | null
  createdAt: string
  settlement?: OwnerSettlementSummary
}

// ---------------------------------------------------------------------------
// Complaints
// ---------------------------------------------------------------------------

export type ComplaintStatus = 'OPEN' | 'ASSIGNED' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED' | 'CANCELLED'
export type ComplaintPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
export type ComplaintCategory =
  | 'PLUMBING'
  | 'ELECTRICAL'
  | 'WIFI'
  | 'CLEANING'
  | 'ROOM'
  | 'BED'
  | 'FURNITURE'
  | 'FOOD'
  | 'SECURITY'
  | 'MAINTENANCE'
  | 'OTHER'
export type ComplaintCommentVisibility = 'PUBLIC' | 'INTERNAL'
export type ComplaintActivityType =
  | 'CREATED'
  | 'ASSIGNED'
  | 'UNASSIGNED'
  | 'STATUS_CHANGED'
  | 'PRIORITY_CHANGED'
  | 'COMMENT_ADDED'
  | 'RESOLVED'
  | 'CLOSED'
  | 'CANCELLED'
  | 'REOPENED'

export interface Complaint {
  id: string
  organizationId: string
  propertyId: string
  residencyId: string
  tenantId: string
  roomId: string | null
  bedId: string | null
  reportedByUserId: string
  assignedToUserId: string | null
  category: ComplaintCategory
  priority: ComplaintPriority
  status: ComplaintStatus
  title: string
  description: string
  resolutionNote: string | null
  resolvedAt: string | null
  closedAt: string | null
  createdAt: string
  updatedAt: string
}

export interface ComplaintActivity {
  id: string
  actorUserId: string
  type: ComplaintActivityType
  oldStatus: ComplaintStatus | null
  newStatus: ComplaintStatus | null
  oldPriority: ComplaintPriority | null
  newPriority: ComplaintPriority | null
  oldAssigneeId: string | null
  newAssigneeId: string | null
  createdAt: string
}

export interface ComplaintComment {
  id: string
  authorUserId: string
  body: string
  visibility: ComplaintCommentVisibility
  createdAt: string
}

export interface ComplaintAttachment {
  id: string
  uploadedByUserId: string
  url: string
  fileName: string
  mimeType: string
  size: number
  createdAt: string
}

// ---------------------------------------------------------------------------
// Food
// ---------------------------------------------------------------------------

export type MealType = 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACK' | 'OTHER'
export type FoodPlanStatus = 'ACTIVE' | 'INACTIVE' | 'ARCHIVED'
export type FoodSubscriptionStatus = 'ACTIVE' | 'PAUSED' | 'CANCELLED' | 'EXPIRED'
export type MenuStatus = 'DRAFT' | 'PUBLISHED' | 'CANCELLED'
export type FoodSubscriptionInvoiceStatus = 'DRAFT' | 'ISSUED' | 'OVERDUE' | 'PAID' | 'VOID'

export interface FoodConfiguration {
  id: string
  organizationId: string
  propertyId: string
  enabled: boolean
  mealsIncludedInRent: boolean
  includedMealTypes: MealType[]
  optionalSubscriptionEnabled: boolean
  createdAt: string
  updatedAt: string
}

export interface MenuItem {
  id: string
  menuId: string
  mealType: MealType
  name: string
  description: string | null
  isVegetarian: boolean
  isAvailable: boolean
}

export interface Menu {
  id: string
  organizationId: string
  propertyId: string
  date: string
  status: MenuStatus
  items: MenuItem[]
  createdAt: string
  updatedAt: string
}

export interface FoodPlan {
  id: string
  organizationId: string
  propertyId: string
  name: string
  description: string | null
  status: FoodPlanStatus
  billingCycle: BillingCycle
  price: string
  currency: string
  mealTypes: MealType[]
  createdAt: string
  updatedAt: string
}

export interface FoodSubscription {
  id: string
  organizationId: string
  propertyId: string
  tenantId: string
  residencyId: string
  foodPlanId: string
  status: FoodSubscriptionStatus
  startDate: string
  endDate: string | null
  priceSnapshot: string
  currency: string
  mealTypesSnapshot: MealType[]
  createdAt: string
  updatedAt: string
}

export type MealConsumptionSource = 'STAFF_MARKED' | 'TENANT_MARKED' | 'SYSTEM'

export interface MealConsumption {
  id: string
  organizationId: string
  propertyId: string
  residencyId: string
  mealType: MealType
  mealDate: string
  menuId: string | null
  itemNamesSnapshot: string[]
  source: MealConsumptionSource
  createdAt: string
}

// ---------------------------------------------------------------------------
// Applications & visits (tenant-discovery)
// ---------------------------------------------------------------------------

export type ApplicationStatus =
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'VISIT_SCHEDULED'
  | 'APPROVED'
  | 'REJECTED'
  | 'WITHDRAWN'
  | 'EXPIRED'
export type VisitStatus = 'REQUESTED' | 'SCHEDULED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW'

export interface Application {
  id: string
  organizationId: string
  propertyId: string
  applicantUserId: string | null
  fullName: string
  phone: string
  email: string | null
  status: ApplicationStatus
  preferredMoveInDate: string | null
  preferredRoomType: RoomType | null
  preferredStayDuration: number | null
  notes: string | null
  rejectionReason: string | null
  reviewedByUserId: string | null
  reviewedAt: string | null
  decisionAt: string | null
  submittedAt: string
  createdAt: string
  updatedAt: string
}

export interface Visit {
  id: string
  organizationId: string
  propertyId: string
  applicationId: string
  applicantUserId: string | null
  scheduledStartAt: string | null
  scheduledEndAt: string | null
  status: VisitStatus
  notes: string | null
  cancelReason: string | null
  createdByUserId: string
  createdAt: string
  updatedAt: string
}

export interface ConversionResult {
  tenantId: string
  applicationId: string
  reused: boolean
}
