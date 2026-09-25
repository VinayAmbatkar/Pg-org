import {
  useApplicationPipeline,
  useComplaintCounts,
  useOccupancy,
  useRentCollection,
} from '@/features/dashboard/hooks/useOperationalData'
import { useFoodConfiguration } from '@/features/food/hooks/useFoodConfiguration'
import { useMenus } from '@/features/food/hooks/useMenus'
import { hasPermission } from '@/infrastructure/permissions/permissions'
import { toLocalDateString } from '@/lib/formatters/date'
import type { MembershipRole } from '@/types/api'
import { buildAlerts } from '../lib/buildAlerts'

/** Actionable alerts for one property, from the same cached queries the dashboard sections use
 * (no extra requests when rendered alongside them). Domains the role can't view are never queried. */
export function useOperationalAlerts(propertyId: string | undefined, role: MembershipRole | null | undefined) {
  const can = (p: Parameters<typeof hasPermission>[1]) => (hasPermission(role, p) ? propertyId : undefined)

  const rent = useRentCollection(can('billing.view'))
  const occupancy = useOccupancy(can('rooms.view'))
  const complaints = useComplaintCounts(propertyId, hasPermission(role, 'complaints.view'))
  const pipeline = useApplicationPipeline(can('applications.view'))
  const today = toLocalDateString()
  const foodConfig = useFoodConfiguration(can('food.view'))
  const menus = useMenus(foodConfig.data?.enabled ? can('food.view') : undefined, { from: today, to: today })

  // Not memoized: buildAlerts is a handful of comparisons over already-derived snapshots.
  const alerts = buildAlerts({
    rent: hasPermission(role, 'billing.view') && !rent.isLoading && !rent.error ? rent.snapshot : undefined,
    occupancy:
      hasPermission(role, 'rooms.view') && !occupancy.isLoading && !occupancy.error ? occupancy.snapshot : undefined,
    complaints:
      hasPermission(role, 'complaints.view') && !complaints.isLoading && !complaints.error
        ? { openUnassigned: complaints.counts.OPEN, highPriorityUnassigned: complaints.highPriorityUnassigned }
        : undefined,
    applications:
      hasPermission(role, 'applications.view') && !pipeline.isLoading && !pipeline.error
        ? { newCount: pipeline.counts.SUBMITTED }
        : undefined,
    food:
      foodConfig.data && (!foodConfig.data.enabled || (menus.data && !menus.error))
        ? {
            enabled: foodConfig.data.enabled,
            todayPublished: (menus.data ?? []).some((m) => m.date.slice(0, 10) === today && m.status === 'PUBLISHED'),
          }
        : undefined,
  })

  return {
    alerts,
    isLoading: rent.isLoading || occupancy.isLoading || complaints.isLoading || pipeline.isLoading,
  }
}
