import { zodResolver } from '@hookform/resolvers/zod'
import { WalletCards } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Dialog } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { DataTable, type DataTableColumn } from '@/components/data-table/DataTable'
import { EmptyState } from '@/components/feedback/EmptyState'
import { PageHeader } from '@/components/layout/PageHeader'
import { useToast } from '@/components/feedback/ToastProvider'
import { useCurrentOrganization } from '@/features/organizations/hooks/useCurrentOrganization'
import { useCurrentProperty } from '@/features/properties/hooks/useCurrentProperty'
import { useResidenciesForProperty } from '@/features/residency/hooks/useResidenciesForProperty'
import { hasPermission } from '@/infrastructure/permissions/permissions'
import { ApiError } from '@/infrastructure/api/errors'
import { formatCurrency } from '@/lib/formatters/currency'
import type { Residency, RentPlan } from '@/types/api'
import { RentPlanStatusBadge } from '../components/RentPlanStatusBadge'
import { useRentPlansForProperty } from '../hooks/useRentPlansForProperty'
import { useCreateRentPlan, useUpdateRentPlan } from '../hooks/useRentPlanMutations'
import { createRentPlanSchema, updateRentPlanSchema, type CreateRentPlanFormValues, type UpdateRentPlanFormValues } from '../schemas/rentPlan.schema'

interface RentPlanRow {
  residency: Residency
  rentPlan: RentPlan | null
}

export function RentPlansPage() {
  const { property, isLoading: propertyLoading } = useCurrentProperty()
  const organization = useCurrentOrganization()
  const canManage = hasPermission(organization?.yourRole, 'billing.manage')
  const { toast } = useToast()

  const { data: residencies, isLoading: residenciesLoading } = useResidenciesForProperty(property?.id)
  const activeResidencies = (residencies ?? []).filter((r) => r.status === 'ACTIVE' || r.status === 'NOTICE_PERIOD')
  const { rows, isLoading: rentPlansLoading } = useRentPlansForProperty(activeResidencies)

  const [assignTarget, setAssignTarget] = useState<Residency | null>(null)
  const [editTarget, setEditTarget] = useState<RentPlan | null>(null)

  const columns: DataTableColumn<RentPlanRow>[] = [
    {
      key: 'tenant',
      header: 'Residency',
      render: (row) => (
        <Link to={`/app/residencies/${row.residency.id}`} className="font-medium underline underline-offset-2">
          {row.residency.tenantId.slice(0, 8)}
        </Link>
      ),
    },
    { key: 'amount', header: 'Rent Amount', render: (row) => (row.rentPlan ? formatCurrency(row.rentPlan.amount, row.rentPlan.currency) : '—') },
    {
      key: 'from',
      header: 'Effective From',
      render: (row) => (row.rentPlan ? new Date(row.rentPlan.effectiveFrom).toLocaleDateString() : '—'),
    },
    {
      key: 'to',
      header: 'Effective To',
      render: (row) => (row.rentPlan?.effectiveTo ? new Date(row.rentPlan.effectiveTo).toLocaleDateString() : row.rentPlan ? 'Ongoing' : '—'),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => (row.rentPlan ? <RentPlanStatusBadge status={row.rentPlan.status} /> : <span className="text-sm text-muted-foreground">No rent plan</span>),
    },
    {
      key: 'actions',
      header: '',
      render: (row) =>
        canManage ? (
          row.rentPlan ? (
            <Button variant="outline" size="sm" onClick={() => setEditTarget(row.rentPlan)}>
              Edit
            </Button>
          ) : (
            <Button variant="outline" size="sm" onClick={() => setAssignTarget(row.residency)}>
              Set rent plan
            </Button>
          )
        ) : null,
      className: 'text-right',
    },
  ]

  const isLoading = propertyLoading || residenciesLoading || rentPlansLoading

  return (
    <div className="space-y-6">
      <PageHeader title="Rent Plans" description={property ? `Rent plans for tenants at ${property.name}.` : undefined} />

      <DataTable
        columns={columns}
        data={rows}
        rowKey={(row) => row.residency.id}
        isLoading={isLoading}
        emptyState={
          <EmptyState
            icon={WalletCards}
            title="No active residencies"
            description="Check in a tenant to start setting up rent plans."
          />
        }
      />

      {assignTarget && (
        <CreateRentPlanDialog
          residency={assignTarget}
          onClose={() => setAssignTarget(null)}
          onSuccess={() => {
            setAssignTarget(null)
            toast({ title: 'Rent plan set', variant: 'success' })
          }}
        />
      )}

      {editTarget && (
        <EditRentPlanDialog
          rentPlan={editTarget}
          onClose={() => setEditTarget(null)}
          onSuccess={() => {
            setEditTarget(null)
            toast({ title: 'Rent plan updated', variant: 'success' })
          }}
        />
      )}
    </div>
  )
}

function CreateRentPlanDialog({
  residency,
  onClose,
  onSuccess,
}: {
  residency: Residency
  onClose: () => void
  onSuccess: () => void
}) {
  const createRentPlan = useCreateRentPlan(residency.id)
  const { toast } = useToast()
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CreateRentPlanFormValues>({ resolver: zodResolver(createRentPlanSchema) })

  async function onSubmit(values: CreateRentPlanFormValues) {
    try {
      await createRentPlan.mutateAsync({ ...values, dueDay: Number(values.dueDay) })
      onSuccess()
    } catch (err) {
      toast({ title: 'Unable to set rent plan', description: err instanceof ApiError ? err.message : undefined, variant: 'error' })
    }
  }

  return (
    <Dialog open onClose={onClose} title="Set rent plan" description="Define the recurring monthly rent for this residency.">
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="amount">Monthly rent amount (₹)</Label>
          <Input id="amount" invalid={Boolean(errors.amount)} {...register('amount')} placeholder="8500" />
          {errors.amount && <p className="text-sm text-destructive" role="alert">{errors.amount.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="dueDay">Due day of month</Label>
          <Input id="dueDay" type="number" min={1} max={31} invalid={Boolean(errors.dueDay)} {...register('dueDay')} />
          {errors.dueDay && <p className="text-sm text-destructive" role="alert">{errors.dueDay.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="effectiveFrom">Effective from</Label>
          <Input id="effectiveFrom" type="date" invalid={Boolean(errors.effectiveFrom)} {...register('effectiveFrom')} />
          {errors.effectiveFrom && <p className="text-sm text-destructive" role="alert">{errors.effectiveFrom.message}</p>}
        </div>
        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isSubmitting}>
            Set rent plan
          </Button>
        </div>
      </form>
    </Dialog>
  )
}

function EditRentPlanDialog({
  rentPlan,
  onClose,
  onSuccess,
}: {
  rentPlan: RentPlan
  onClose: () => void
  onSuccess: () => void
}) {
  const updateRentPlan = useUpdateRentPlan(rentPlan.id, rentPlan.residencyId)
  const { toast } = useToast()
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<UpdateRentPlanFormValues>({
    resolver: zodResolver(updateRentPlanSchema),
    defaultValues: { dueDay: String(rentPlan.dueDay) },
  })

  async function onSubmit(values: UpdateRentPlanFormValues) {
    try {
      await updateRentPlan.mutateAsync({ dueDay: Number(values.dueDay) })
      onSuccess()
    } catch (err) {
      toast({ title: 'Unable to update rent plan', description: err instanceof ApiError ? err.message : undefined, variant: 'error' })
    }
  }

  async function onDeactivate() {
    try {
      await updateRentPlan.mutateAsync({ deactivate: true })
      onSuccess()
    } catch (err) {
      toast({ title: 'Unable to deactivate rent plan', description: err instanceof ApiError ? err.message : undefined, variant: 'error' })
    }
  }

  return (
    <Dialog open onClose={onClose} title="Edit rent plan" description={`${formatCurrency(rentPlan.amount, rentPlan.currency)} / month — amount is fixed once set; create a new plan to change it.`}>
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="dueDay">Due day of month</Label>
          <Input id="dueDay" type="number" min={1} max={31} invalid={Boolean(errors.dueDay)} {...register('dueDay')} />
          {errors.dueDay && <p className="text-sm text-destructive" role="alert">{errors.dueDay.message}</p>}
        </div>
        <div className="flex items-center justify-between gap-3">
          <Button type="button" variant="outline" className="text-destructive" isLoading={updateRentPlan.isPending} onClick={onDeactivate}>
            Deactivate plan
          </Button>
          <div className="flex gap-3">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              Save
            </Button>
          </div>
        </div>
      </form>
    </Dialog>
  )
}
