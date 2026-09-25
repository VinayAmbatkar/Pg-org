import type { LucideIcon } from 'lucide-react'
import { ClipboardList, Receipt, UserPlus, Users } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useInvoicesForProperty } from '@/features/billing/hooks/useInvoicesForProperty'
import { useResidenciesForProperty } from '@/features/residency/hooks/useResidenciesForProperty'
import { hasPermission } from '@/infrastructure/permissions/permissions'
import { formatRelativeTime } from '@/lib/formatters/date'
import { cn } from '@/lib/utils/cn'
import type { MembershipRole } from '@/types/api'
import { useApplicationPipeline, useComplaintCounts } from '../hooks/useOperationalData'
import { DashboardCard } from './DashboardSections'

interface ActivityEntry {
  id: string
  at: string
  title: string
  to: string
  icon: LucideIcon
  tone: string
}

// pg-backend has no owner-facing activity/audit endpoint (audit logs are SUPER_ADMIN-only), so this
// feed is assembled from real timestamps on records already loaded for the dashboard. Each entry
// describes exactly the event its timestamp records — creation/issue/submission — never an
// inferred "updated" event.
export function RecentActivityCard({
  propertyId,
  role,
  className,
}: {
  propertyId: string
  role: MembershipRole | null | undefined
  className?: string
}) {
  const invoices = useInvoicesForProperty(hasPermission(role, 'billing.view') ? propertyId : undefined)
  const residencies = useResidenciesForProperty(hasPermission(role, 'tenants.view') ? propertyId : undefined)
  const complaints = useComplaintCounts(propertyId, hasPermission(role, 'complaints.view'))
  const applications = useApplicationPipeline(hasPermission(role, 'applications.view') ? propertyId : undefined)

  const entries: ActivityEntry[] = []
  for (const invoice of invoices.data ?? []) {
    if (!invoice.issueDate || invoice.status === 'DRAFT') continue
    entries.push({
      id: `invoice-${invoice.id}`,
      at: invoice.issueDate,
      title: `Invoice ${invoice.invoiceNumber} issued`,
      to: `/app/billing/invoices/${invoice.id}`,
      icon: Receipt,
      tone: 'bg-[#fff4e5] text-[#b45309]',
    })
  }
  for (const residency of residencies.data ?? []) {
    entries.push({
      id: `residency-${residency.id}`,
      at: residency.createdAt,
      title: 'New tenant stay created',
      to: `/app/residencies/${residency.id}`,
      icon: Users,
      tone: 'bg-[#e5fbf3] text-[#12ad79]',
    })
  }
  for (const complaint of complaints.newestOpen) {
    entries.push({
      id: `complaint-${complaint.id}`,
      at: complaint.createdAt,
      title: `Complaint reported: ${complaint.title}`,
      to: `/app/complaints/${complaint.id}`,
      icon: ClipboardList,
      tone: 'bg-[#ffeaf5] text-[#ed4094]',
    })
  }
  for (const application of applications.newest) {
    entries.push({
      id: `application-${application.id}`,
      at: application.submittedAt ?? application.createdAt,
      title: `Application from ${application.fullName}`,
      to: `/app/applications/${application.id}`,
      icon: UserPlus,
      tone: 'bg-[#eaf2ff] text-[#3775e8]',
    })
  }
  entries.sort((a, b) => b.at.localeCompare(a.at))

  const isLoading = invoices.isLoading || residencies.isLoading || complaints.isLoading || applications.isLoading

  return (
    <DashboardCard
      title="Recent Activity"
      description="Latest invoices, stays, new complaints and new applications."
      isLoading={isLoading && entries.length === 0}
      className={className}
    >
      {entries.length === 0 ? (
        <p className="py-6 text-center text-xs text-muted-foreground">No activity yet.</p>
      ) : (
        <ul className="space-y-3">
          {entries.slice(0, 8).map(({ id, at, title, to, icon: Icon, tone }) => (
            <li key={id}>
              <Link
                to={to}
                className="flex items-start gap-3 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <span className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-lg', tone)}>
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </span>
                <span className="min-w-0 flex-1 truncate pt-1.5 text-xs font-medium text-[#182345] hover:underline">
                  {title}
                </span>
                <time dateTime={at} className="shrink-0 pt-1.5 text-[10px] text-muted-foreground">
                  {formatRelativeTime(at)}
                </time>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </DashboardCard>
  )
}
