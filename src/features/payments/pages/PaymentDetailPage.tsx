import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useParams } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ErrorState } from '@/components/feedback/ErrorState'
import { PageSpinner } from '@/components/feedback/PageSpinner'
import { useToast } from '@/components/feedback/ToastProvider'
import { useCurrentOrganization } from '@/features/organizations/hooks/useCurrentOrganization'
import { hasPermission } from '@/infrastructure/permissions/permissions'
import { ApiError } from '@/infrastructure/api/errors'
import { formatCurrency } from '@/lib/formatters/currency'
import { PaymentStatusBadge } from '../components/PaymentStatusBadge'
import { usePayment } from '../hooks/usePayment'
import { useRefundPayment } from '../hooks/usePaymentMutations'
import { refundSchema, type RefundFormValues } from '../schemas/refund.schema'

export function PaymentDetailPage() {
  const { paymentId = '' } = useParams()
  const { toast } = useToast()
  const organization = useCurrentOrganization()
  const canRefund = hasPermission(organization?.yourRole, 'payments.refund')

  const { data: payment, isLoading, error, refetch } = usePayment(paymentId)
  const refundPayment = useRefundPayment(paymentId)
  const [refundOpen, setRefundOpen] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<RefundFormValues>({ resolver: zodResolver(refundSchema) })

  if (isLoading) return <PageSpinner />
  if (error || !payment) return <ErrorState error={error} onRetry={() => refetch()} />

  async function onRefund(values: RefundFormValues) {
    try {
      await refundPayment.mutateAsync({
        amount: values.amount || undefined,
        reason: values.reason || undefined,
      })
      toast({ title: 'Refund processed', variant: 'success' })
      setRefundOpen(false)
      reset()
    } catch (err) {
      toast({ title: 'Unable to process refund', description: err instanceof ApiError ? err.message : undefined, variant: 'error' })
    }
  }

  const canRefundNow = canRefund && (payment.status === 'CAPTURED' || payment.status === 'PARTIALLY_REFUNDED')

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold">Payment</h1>
            <PaymentStatusBadge status={payment.status} />
          </div>
          <p className="text-sm text-muted-foreground">
            Invoice:{' '}
            <Link to={`/app/billing/invoices/${payment.invoiceId}`} className="underline underline-offset-2">
              {payment.invoiceId.slice(0, 8)}
            </Link>
          </p>
        </div>
        {canRefundNow && <Button variant="outline" className="text-destructive" onClick={() => setRefundOpen(true)}>Refund</Button>}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Amount breakdown</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Gross amount (paid by tenant)</span>
            <span className="font-medium">{formatCurrency(payment.amount, payment.currency)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Platform fee</span>
            <span>-{formatCurrency(payment.platformFee, payment.currency)}</span>
          </div>
          <div className="flex justify-between border-t border-border pt-2 text-base font-semibold">
            <span>Owner settlement</span>
            <span>{formatCurrency(payment.ownerSettlementAmount, payment.currency)}</span>
          </div>
        </CardContent>
      </Card>

      {payment.settlement && (
        <Card>
          <CardHeader>
            <CardTitle>Settlement</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Status</span>
              <span className="font-medium">{payment.settlement.status}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Settled at</span>
              <span>{payment.settlement.settledAt ? new Date(payment.settlement.settledAt).toLocaleString() : 'Not settled yet'}</span>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Method</span>
            <span>{payment.method ?? '—'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Paid at</span>
            <span>{payment.paidAt ? new Date(payment.paidAt).toLocaleString() : 'Not captured yet'}</span>
          </div>
          {payment.failureMessage && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Failure reason</span>
              <span className="text-destructive">{payment.failureMessage}</span>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={refundOpen} onClose={() => setRefundOpen(false)} title="Refund this payment" description="Leave amount blank to refund the full remaining amount.">
        <form onSubmit={handleSubmit(onRefund)} noValidate className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="amount">Refund amount (₹) — optional</Label>
            <Input id="amount" invalid={Boolean(errors.amount)} {...register('amount')} placeholder="Full amount" />
            {errors.amount && <p className="text-sm text-destructive" role="alert">{errors.amount.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="reason">Reason — optional</Label>
            <Input id="reason" invalid={Boolean(errors.reason)} {...register('reason')} />
            {errors.reason && <p className="text-sm text-destructive" role="alert">{errors.reason.message}</p>}
          </div>
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => setRefundOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="destructive" isLoading={isSubmitting}>
              Refund
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  )
}
