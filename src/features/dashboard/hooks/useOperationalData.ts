import { useMemo } from 'react'
import { useApplicationsForProperty } from '@/features/applications/hooks/useApplications'
import { useInvoicesForProperty } from '@/features/billing/hooks/useInvoicesForProperty'
import { useComplaints } from '@/features/complaints/hooks/useComplaints'
import { useResidenciesForProperty } from '@/features/residency/hooks/useResidenciesForProperty'
import { useRooms } from '@/features/rooms/hooks/useRooms'
import type { ApplicationStatus, ComplaintStatus } from '@/types/api'
import { computeOccupancy, computeRentCollection } from '../lib/metrics'

// Each hook here owns one dashboard/Property 360 domain. They share query keys with the module
// pages (rooms, residencies, invoices, complaints, applications), so data a user has already
// loaded elsewhere is reused from cache rather than refetched, and several sections calling the
// same hook cost one request. Pass `undefined` as propertyId (or enabled=false) to skip a domain
// the current role can't view.

export function useOccupancy(propertyId: string | undefined) {
  const rooms = useRooms(propertyId)
  const residencies = useResidenciesForProperty(propertyId)

  const snapshot = useMemo(
    () => computeOccupancy(rooms.data ?? [], residencies.data ?? []),
    [rooms.data, residencies.data],
  )

  return {
    snapshot,
    roomCount: rooms.data?.filter((r) => r.status !== 'ARCHIVED').length ?? 0,
    isLoading: rooms.isLoading || residencies.isLoading,
    error: rooms.error ?? residencies.error,
    refetch: () => {
      if (rooms.error) void rooms.refetch()
      if (residencies.error) void residencies.refetch()
    },
  }
}

export function useRentCollection(propertyId: string | undefined) {
  const invoices = useInvoicesForProperty(propertyId)
  // Recomputed when the invoice list changes; "now" is fixed per list version, which is precise
  // enough for day-granularity due/overdue buckets.
  const snapshot = useMemo(() => computeRentCollection(invoices.data ?? [], new Date()), [invoices.data])
  return { snapshot, isLoading: invoices.isLoading, error: invoices.error, refetch: invoices.refetch }
}

const COMPLAINT_STAGES = ['OPEN', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED'] as const satisfies readonly ComplaintStatus[]

/** Exact per-status complaint counts via `limit: 1` queries (reading `.total`) — the list endpoint
 * has no "status in [...]" filter. The OPEN query uses limit 5 so the same request also yields the
 * newest unassigned complaints for the activity feed. */
export function useComplaintCounts(propertyId: string | undefined, enabled: boolean) {
  const open = useComplaints(
    { propertyId, status: 'OPEN', limit: 5, sortBy: 'createdAt', sortDir: 'desc' },
    { enabled: enabled && Boolean(propertyId) },
  )
  const assigned = useComplaints({ propertyId, status: 'ASSIGNED', limit: 1 }, { enabled: enabled && Boolean(propertyId) })
  const inProgress = useComplaints(
    { propertyId, status: 'IN_PROGRESS', limit: 1 },
    { enabled: enabled && Boolean(propertyId) },
  )
  const resolved = useComplaints({ propertyId, status: 'RESOLVED', limit: 1 }, { enabled: enabled && Boolean(propertyId) })
  // Exact, not derived from the 5 newest: unassigned complaints at URGENT / HIGH priority.
  const openUrgent = useComplaints(
    { propertyId, status: 'OPEN', priority: 'URGENT', limit: 1 },
    { enabled: enabled && Boolean(propertyId) },
  )
  const openHigh = useComplaints(
    { propertyId, status: 'OPEN', priority: 'HIGH', limit: 1 },
    { enabled: enabled && Boolean(propertyId) },
  )
  const queries = [open, assigned, inProgress, resolved, openUrgent, openHigh]

  const counts: Record<(typeof COMPLAINT_STAGES)[number], number> = {
    OPEN: open.data?.total ?? 0,
    ASSIGNED: assigned.data?.total ?? 0,
    IN_PROGRESS: inProgress.data?.total ?? 0,
    RESOLVED: resolved.data?.total ?? 0,
  }

  return {
    counts,
    unresolved: counts.OPEN + counts.ASSIGNED + counts.IN_PROGRESS,
    newestOpen: open.data?.items ?? [],
    /** OPEN (unassigned) complaints at URGENT or HIGH priority. */
    highPriorityUnassigned: (openUrgent.data?.total ?? 0) + (openHigh.data?.total ?? 0),
    isLoading: queries.some((q) => q.isLoading),
    error: queries.find((q) => q.error)?.error ?? null,
    refetch: () => queries.filter((q) => q.error).forEach((q) => void q.refetch()),
  }
}

export const PIPELINE_STAGES = [
  { status: 'SUBMITTED', label: 'New' },
  { status: 'UNDER_REVIEW', label: 'Under review' },
  { status: 'VISIT_SCHEDULED', label: 'Visit scheduled' },
  { status: 'APPROVED', label: 'Approved' },
] as const satisfies ReadonlyArray<{ status: ApplicationStatus; label: string }>

/** How many applications are *currently* in each stage (a snapshot, not a cohort funnel — the
 * backend exposes no stage-transition history, so conversion rates would be fabricated). The
 * SUBMITTED query uses limit 5 so it also yields the newest applications for the activity feed. */
export function useApplicationPipeline(propertyId: string | undefined) {
  const submitted = useApplicationsForProperty(propertyId, { status: 'SUBMITTED', limit: 5 })
  const underReview = useApplicationsForProperty(propertyId, { status: 'UNDER_REVIEW', limit: 1 })
  const visitScheduled = useApplicationsForProperty(propertyId, { status: 'VISIT_SCHEDULED', limit: 1 })
  const approved = useApplicationsForProperty(propertyId, { status: 'APPROVED', limit: 1 })
  const queries = [submitted, underReview, visitScheduled, approved]

  const counts: Record<(typeof PIPELINE_STAGES)[number]['status'], number> = {
    SUBMITTED: submitted.data?.total ?? 0,
    UNDER_REVIEW: underReview.data?.total ?? 0,
    VISIT_SCHEDULED: visitScheduled.data?.total ?? 0,
    APPROVED: approved.data?.total ?? 0,
  }

  return {
    counts,
    /** Awaiting an owner decision: new, under review, or visit scheduled. */
    pending: counts.SUBMITTED + counts.UNDER_REVIEW + counts.VISIT_SCHEDULED,
    newest: submitted.data?.items ?? [],
    isLoading: queries.some((q) => q.isLoading),
    error: queries.find((q) => q.error)?.error ?? null,
    refetch: () => queries.filter((q) => q.error).forEach((q) => void q.refetch()),
  }
}
