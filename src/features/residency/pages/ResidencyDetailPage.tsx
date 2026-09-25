import { useQueryClient } from '@tanstack/react-query'
import { ChevronLeft } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { APP_PATHS } from '@/app/router/paths'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { TabPanel, Tabs } from '@/components/ui/tabs'
import { ConfirmDialog } from '@/components/feedback/ConfirmDialog'
import { SectionBoundary } from '@/components/feedback/ErrorBoundary'
import { ErrorState } from '@/components/feedback/ErrorState'
import { PageSpinner } from '@/components/feedback/PageSpinner'
import { useToast } from '@/components/feedback/ToastProvider'
import { useGenerateInvoice } from '@/features/billing/hooks/useInvoiceMutations'
import { useCurrentOrganization } from '@/features/organizations/hooks/useCurrentOrganization'
import { useProperty } from '@/features/properties/hooks/useProperty'
import { useSyncCurrentProperty } from '@/features/properties/hooks/useSyncCurrentProperty'
import { useTenant } from '@/features/tenants/hooks/useTenant'
import { useTenantIdentity } from '@/features/tenants/hooks/useTenantIdentity'
import { useUrlState } from '@/hooks/useUrlState'
import { ApiError } from '@/infrastructure/api/errors'
import { hasPermission, type Permission } from '@/infrastructure/permissions/permissions'
import { formatDate } from '@/lib/formatters/date'
import type { Bed, Room } from '@/types/api'
import { bedKeys } from '@/features/beds/api/queryKeys'
import { roomKeys } from '@/features/rooms/api/queryKeys'
import { getCachedAllocationForResidency } from '../api/allocationCache'
import { CheckInDialog } from '../components/CheckInDialog'
import { ResidencyStatusBadge } from '../components/ResidencyStatusBadge'
import { ActivityTab } from '../components/tenant360/ActivityTab'
import { ComplaintsTab } from '../components/tenant360/ComplaintsTab'
import { FoodTab } from '../components/tenant360/FoodTab'
import { InvoicesTab } from '../components/tenant360/InvoicesTab'
import { PaymentsTab } from '../components/tenant360/PaymentsTab'
import { RentTab } from '../components/tenant360/RentTab'
import { useResidency } from '../hooks/useResidency'
import { useCheckOut, useUpdateResidency } from '../hooks/useResidencyMutations'

// Secondary tabs mount (and fetch) only when selected.
const TABS: { value: string; label: string; permission: Permission }[] = [
  { value: 'overview', label: 'Overview', permission: 'residency.view' },
  { value: 'rent', label: 'Rent', permission: 'billing.view' },
  { value: 'invoices', label: 'Invoices', permission: 'billing.view' },
  { value: 'payments', label: 'Payments', permission: 'payments.view' },
  { value: 'complaints', label: 'Complaints', permission: 'complaints.view' },
  { value: 'food', label: 'Food', permission: 'food.view' },
  { value: 'activity', label: 'Activity', permission: 'residency.view' },
]
const TAB_ID = 'tenant-360'

export function ResidencyDetailPage() {
  const { residencyId = '' } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const organization = useCurrentOrganization()
  const role = organization?.yourRole
  const canManage = hasPermission(role, 'residency.manage')

  const { data: residency, isLoading, error, refetch } = useResidency(residencyId)
  const { data: tenant } = useTenant(residency?.tenantId)
  const { data: property } = useProperty(residency?.propertyId)
  const { identity } = useTenantIdentity(residency?.propertyId, tenant)
  useSyncCurrentProperty(residency?.propertyId)

  const [requestedTab, setTab] = useUrlState('tab', 'overview')
  const tabs = TABS.filter((t) => hasPermission(role, t.permission))
  const tab = tabs.some((t) => t.value === requestedTab) ? requestedTab : 'overview'

  const [checkInOpen, setCheckInOpen] = useState(false)
  const [checkOutOpen, setCheckOutOpen] = useState(false)
  const [editingEndDate, setEditingEndDate] = useState(false)
  const [invoiceMonthOpen, setInvoiceMonthOpen] = useState(false)
  const now = new Date()
  const [invoiceYear, setInvoiceYear] = useState(now.getFullYear())
  const [invoiceMonth, setInvoiceMonth] = useState(now.getMonth() + 1)

  const checkOut = useCheckOut(residencyId)
  const updateResidency = useUpdateResidency(residencyId)
  const generateInvoice = useGenerateInvoice(residencyId, residency?.propertyId ?? '')

  const {
    register: registerEndDate,
    handleSubmit: handleSubmitEndDate,
    reset: resetEndDate,
    formState: { errors: endDateErrors, isSubmitting: isSubmittingEndDate },
  } = useForm<{ expectedEndDate: string }>()

  if (isLoading) return <PageSpinner />
  if (error || !residency) return <ErrorState error={error} onRetry={() => refetch()} />

  const tenantLabel = identity?.fullName ?? `Tenant ${residency.tenantId.slice(0, 8)}`
  const allocation = getCachedAllocationForResidency(queryClient, residencyId)
  const allocatedBed = allocation ? findCachedBed(queryClient, residency.propertyId, allocation.bedId) : undefined
  const isActive = residency.status === 'ACTIVE' || residency.status === 'NOTICE_PERIOD'
  const showCheckIn = canManage && residency.status === 'PENDING'
  const showCheckOut = canManage && isActive
  const invoiceYearValid = Number.isInteger(invoiceYear) && invoiceYear >= 2000 && invoiceYear <= 2100

  function startEditingEndDate() {
    // Seed from the loaded residency (a date input needs YYYY-MM-DD, not an ISO timestamp).
    resetEndDate({ expectedEndDate: residency?.expectedEndDate?.slice(0, 10) ?? '' })
    setEditingEndDate(true)
  }

  async function onCheckOut() {
    try {
      await checkOut.mutateAsync()
      toast({ title: `${tenantLabel} checked out`, variant: 'success' })
      setCheckOutOpen(false)
    } catch (err) {
      toast({ title: 'Unable to check out', description: err instanceof ApiError ? err.message : undefined, variant: 'error' })
    }
  }

  async function onSaveEndDate(values: { expectedEndDate: string }) {
    try {
      await updateResidency.mutateAsync({ expectedEndDate: values.expectedEndDate })
      toast({ title: 'Expected end date updated', variant: 'success' })
      setEditingEndDate(false)
    } catch (err) {
      toast({
        title: 'Unable to update expected end date',
        description: err instanceof ApiError ? err.message : undefined,
        variant: 'error',
      })
    }
  }

  async function onGenerateInvoice() {
    try {
      const invoice = await generateInvoice.mutateAsync({ year: invoiceYear, month: invoiceMonth })
      toast({ title: 'Invoice generated', variant: 'success' })
      setInvoiceMonthOpen(false)
      navigate(`${APP_PATHS.billing}/invoices/${invoice.id}`)
    } catch (err) {
      toast({ title: 'Unable to generate invoice', description: err instanceof ApiError ? err.message : undefined, variant: 'error' })
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Link to={APP_PATHS.tenants} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ChevronLeft className="h-4 w-4" aria-hidden="true" /> All tenants
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold">{tenantLabel}</h1>
            <ResidencyStatusBadge status={residency.status} />
          </div>
          <dl className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-muted-foreground">
            {identity?.phone && (
              <div className="flex gap-1">
                <dt>Phone</dt>
                <dd className="font-medium text-foreground">{identity.phone}</dd>
              </div>
            )}
            <div className="flex gap-1">
              <dt>Property</dt>
              <dd>
                <Link to={`${APP_PATHS.properties}/${residency.propertyId}`} className="font-medium text-foreground underline underline-offset-2">
                  {property?.name ?? 'View property'}
                </Link>
              </dd>
            </div>
            {allocatedBed && (
              <div className="flex gap-1">
                <dt>Bed</dt>
                <dd className="font-medium text-foreground">{allocatedBed}</dd>
              </div>
            )}
            <div className="flex gap-1">
              <dt>Since</dt>
              <dd className="font-medium text-foreground">{formatDate(residency.startDate)}</dd>
            </div>
          </dl>
          {!identity && (
            <p className="text-xs text-muted-foreground">
              Name and phone appear for tenants onboarded from an application. PGMet doesn&apos;t expose other tenant details yet.
            </p>
          )}
        </div>
        <div className="flex gap-2">
          {showCheckIn && <Button onClick={() => setCheckInOpen(true)}>Check in</Button>}
          {showCheckOut && (
            <Button variant="outline" className="text-destructive" onClick={() => setCheckOutOpen(true)}>
              Check out
            </Button>
          )}
        </div>
      </div>

      <Tabs items={tabs} value={tab} onChange={setTab} label="Tenant sections" idBase={TAB_ID} />

      <TabPanel idBase={TAB_ID} value={tab}>
        <SectionBoundary resetKeys={[residencyId, tab]}>
          {tab === 'rent' && <RentTab residencyId={residencyId} />}
          {tab === 'invoices' && <InvoicesTab propertyId={residency.propertyId} residencyId={residencyId} />}
          {tab === 'payments' && <PaymentsTab propertyId={residency.propertyId} residencyId={residencyId} />}
          {tab === 'complaints' && <ComplaintsTab propertyId={residency.propertyId} residencyId={residencyId} />}
          {tab === 'food' && <FoodTab propertyId={residency.propertyId} residencyId={residencyId} />}
          {tab === 'activity' && <ActivityTab residency={residency} />}

          {tab === 'overview' && (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Residency</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <dl className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
                    <div>
                      <dt className="text-muted-foreground">Status</dt>
                      <dd className="mt-0.5">
                        <ResidencyStatusBadge status={residency.status} />
                      </dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Start date</dt>
                      <dd className="font-medium">{formatDate(residency.startDate)}</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Actual end date</dt>
                      <dd className="font-medium">{formatDate(residency.actualEndDate)}</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Room / bed</dt>
                      <dd className="font-medium">
                        {allocatedBed ??
                          (residency.status === 'PENDING'
                            ? 'Not checked in yet'
                            : 'Not available (PGMet has no bed-allocation lookup yet)')}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Tenant ID</dt>
                      <dd className="font-mono text-xs">{tenant?.id ?? residency.tenantId}</dd>
                    </div>
                    {identity && (
                      <div>
                        <dt className="text-muted-foreground">Application</dt>
                        <dd>
                          <Link to={`${APP_PATHS.applications}/${identity.applicationId}`} className="font-medium underline underline-offset-2">
                            View application
                          </Link>
                        </dd>
                      </div>
                    )}
                  </dl>

                  <div className="space-y-1.5 border-t border-border pt-4">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="expectedEndDate">Expected end date</Label>
                      {canManage && !editingEndDate && residency.status !== 'CHECKED_OUT' && (
                        <Button variant="outline" size="sm" onClick={startEditingEndDate}>
                          Edit
                        </Button>
                      )}
                    </div>
                    {editingEndDate ? (
                      <form onSubmit={handleSubmitEndDate(onSaveEndDate)} noValidate className="flex flex-wrap items-end gap-3">
                        <div className="min-w-[200px] flex-1 space-y-1.5">
                          <Input
                            id="expectedEndDate"
                            type="date"
                            min={residency.startDate.slice(0, 10)}
                            invalid={Boolean(endDateErrors.expectedEndDate)}
                            aria-describedby={endDateErrors.expectedEndDate ? 'expectedEndDate-error' : undefined}
                            {...registerEndDate('expectedEndDate', {
                              required: 'Expected end date is required',
                              validate: (v) => v >= residency.startDate.slice(0, 10) || 'End date cannot be before the start date',
                            })}
                          />
                          {endDateErrors.expectedEndDate && (
                            <p id="expectedEndDate-error" className="text-sm text-destructive" role="alert">
                              {endDateErrors.expectedEndDate.message}
                            </p>
                          )}
                        </div>
                        <Button type="button" variant="outline" onClick={() => setEditingEndDate(false)} disabled={isSubmittingEndDate}>
                          Cancel
                        </Button>
                        <Button type="submit" isLoading={isSubmittingEndDate}>
                          Save
                        </Button>
                      </form>
                    ) : (
                      <p className="text-sm font-medium">{residency.expectedEndDate ? formatDate(residency.expectedEndDate) : 'Not set'}</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {isActive && hasPermission(role, 'billing.view') && (
                <Card>
                  <CardHeader>
                    <CardTitle>Billing</CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-wrap items-center gap-3">
                    <Button variant="outline" size="sm" onClick={() => setTab('rent')}>
                      View rent plan
                    </Button>
                    {hasPermission(role, 'billing.manage') && (
                      <Button variant="outline" size="sm" onClick={() => setInvoiceMonthOpen(true)}>
                        Generate invoice
                      </Button>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </SectionBoundary>
      </TabPanel>

      <Dialog
        open={invoiceMonthOpen}
        onClose={() => setInvoiceMonthOpen(false)}
        preventClose={generateInvoice.isPending}
        title="Generate invoice"
        description="Creates a draft rent invoice for the selected month from this tenant's active rent plan."
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="invoiceMonth">Month</Label>
              <Select id="invoiceMonth" value={invoiceMonth} onChange={(e) => setInvoiceMonth(Number(e.target.value))}>
                {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                  <option key={m} value={m}>
                    {new Date(2000, m - 1, 1).toLocaleDateString('en-IN', { month: 'long' })}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="invoiceYear">Year</Label>
              <Input
                id="invoiceYear"
                type="number"
                min={2000}
                max={2100}
                value={Number.isNaN(invoiceYear) ? '' : invoiceYear}
                invalid={!invoiceYearValid}
                onChange={(e) => setInvoiceYear(Number(e.target.value))}
              />
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => setInvoiceMonthOpen(false)} disabled={generateInvoice.isPending}>
              Cancel
            </Button>
            <Button type="button" isLoading={generateInvoice.isPending} disabled={!invoiceYearValid || generateInvoice.isPending} onClick={onGenerateInvoice}>
              Generate
            </Button>
          </div>
        </div>
      </Dialog>

      {checkInOpen && (
        <CheckInDialog residencyId={residencyId} propertyId={residency.propertyId} onClose={() => setCheckInOpen(false)} />
      )}

      <ConfirmDialog
        open={checkOutOpen}
        onClose={() => setCheckOutOpen(false)}
        onConfirm={onCheckOut}
        title={`Check out ${tenantLabel}?`}
        description="This ends the stay today and frees their bed for a new tenant. It can't be undone — a returning tenant needs a new stay."
        confirmLabel="Check out"
        isLoading={checkOut.isPending}
      />
    </div>
  )
}

/** Resolves "Room 204 · Bed A" for a bed id from data already in the query cache (never fetches). */
function findCachedBed(queryClient: ReturnType<typeof useQueryClient>, propertyId: string, bedId: string): string | undefined {
  for (const [, beds] of queryClient.getQueriesData<Bed[]>({ queryKey: bedKeys.all })) {
    const bed = beds?.find((b) => b.id === bedId)
    if (!bed) continue
    const room = queryClient.getQueryData<Room[]>(roomKeys.lists(propertyId))?.find((r) => r.id === bed.roomId)
    return room ? `Room ${room.roomNumber} · Bed ${bed.bedNumber}` : `Bed ${bed.bedNumber}`
  }
  return undefined
}
