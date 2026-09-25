import { Building2, ClipboardList, DoorOpen, Receipt, UserPlus } from 'lucide-react'
import { APP_PATHS } from '@/app/router/paths'
import { useApplicationsForProperty } from '@/features/applications/hooks/useApplications'
import { useInvoicesForProperty } from '@/features/billing/hooks/useInvoicesForProperty'
import { useComplaints } from '@/features/complaints/hooks/useComplaints'
import { useCurrentOrganization } from '@/features/organizations/hooks/useCurrentOrganization'
import { useCurrentProperty } from '@/features/properties/hooks/useCurrentProperty'
import { useRooms } from '@/features/rooms/hooks/useRooms'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { hasPermission } from '@/infrastructure/permissions/permissions'
import { matches, navigationResults, type SearchResult } from '../lib/commands'

const MIN_QUERY = 2
const PER_GROUP = 5

/** Search sources — only real capabilities, each gated by the role's view permission:
 * - Pages & actions: static, permission-filtered.
 * - Complaints: server-side `GET /complaints?search=` (the only backend search), org-wide.
 * - Properties, rooms, invoices (by number), applications (name/phone/email): client-side over lists
 *   the app already loads, scoped to the current property where the backend lists are per-property.
 *   Applications are matched within the 100 most recent (the backend max page size).
 * Queries for a domain only fire once the palette has a query of MIN_QUERY+ characters. */
export function useCommandSearch(rawQuery: string, enabled: boolean) {
  const organization = useCurrentOrganization()
  const role = organization?.yourRole
  const { property, properties } = useCurrentProperty()
  const query = useDebouncedValue(rawQuery.trim(), 200)
  const active = enabled && query.length >= MIN_QUERY
  const propertyId = property?.id
  const scoped = (permission: Parameters<typeof hasPermission>[1]) =>
    active && hasPermission(role, permission) ? propertyId : undefined

  const complaints = useComplaints(
    { search: query, limit: PER_GROUP, sortBy: 'createdAt', sortDir: 'desc' },
    { enabled: active && hasPermission(role, 'complaints.view') },
  )
  const rooms = useRooms(scoped('rooms.view'))
  const invoices = useInvoicesForProperty(scoped('billing.view'))
  const applications = useApplicationsForProperty(scoped('applications.view'), { limit: 100 })

  const results: SearchResult[] = navigationResults(rawQuery, role, propertyId)

  if (query.length >= MIN_QUERY) {
    if (hasPermission(role, 'properties.view')) {
      for (const p of properties.filter((p) => matches(query, p.name, p.city, p.addressLine1)).slice(0, PER_GROUP)) {
        results.push({
          id: `property-${p.id}`,
          group: 'Properties',
          title: p.name,
          subtitle: `${p.city}, ${p.state}`,
          to: `${APP_PATHS.properties}/${p.id}`,
          icon: Building2,
        })
      }
    }
    for (const room of (rooms.data ?? []).filter((r) => matches(query, r.roomNumber, `room ${r.roomNumber}`)).slice(0, PER_GROUP)) {
      results.push({
        id: `room-${room.id}`,
        group: 'Rooms',
        title: `Room ${room.roomNumber}`,
        subtitle: property?.name,
        to: `${APP_PATHS.properties}/${room.propertyId}/rooms/${room.id}`,
        icon: DoorOpen,
      })
    }
    for (const invoice of (invoices.data ?? []).filter((i) => matches(query, i.invoiceNumber)).slice(0, PER_GROUP)) {
      results.push({
        id: `invoice-${invoice.id}`,
        group: 'Invoices',
        title: invoice.invoiceNumber,
        subtitle: property?.name,
        to: `${APP_PATHS.billing}/invoices/${invoice.id}`,
        icon: Receipt,
      })
    }
    for (const a of (applications.data?.items ?? []).filter((a) => matches(query, a.fullName, a.phone, a.email)).slice(0, PER_GROUP)) {
      results.push({
        id: `application-${a.id}`,
        group: 'Applications',
        title: a.fullName,
        subtitle: [a.phone, property?.name].filter(Boolean).join(' · '),
        to: `${APP_PATHS.applications}/${a.id}`,
        icon: UserPlus,
      })
    }
    for (const c of complaints.data?.items ?? []) {
      results.push({
        id: `complaint-${c.id}`,
        group: 'Complaints',
        title: c.title,
        subtitle: properties.find((p) => p.id === c.propertyId)?.name,
        to: `${APP_PATHS.complaints}/${c.id}`,
        icon: ClipboardList,
      })
    }
  }

  const isSearching =
    query !== rawQuery.trim() ||
    (active && (complaints.isFetching || rooms.isLoading || invoices.isLoading || applications.isLoading))

  return { results, isSearching, propertyName: property?.name, minQuery: MIN_QUERY }
}
