import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ConfirmDialog } from '@/components/feedback/ConfirmDialog'
import { ErrorState } from '@/components/feedback/ErrorState'
import { PageSpinner } from '@/components/feedback/PageSpinner'
import { useToast } from '@/components/feedback/ToastProvider'
import { PaymentStatusBadge } from '@/features/payments/components/PaymentStatusBadge'
import { usePaymentsForInvoice } from '@/features/payments/hooks/usePaymentsForInvoice'
import { useCurrentOrganization } from '@/features/organizations/hooks/useCurrentOrganization'
import { hasPermission } from '@/infrastructure/permissions/permissions'
import { ApiError } from '@/infrastructure/api/errors'
import { formatCurrency } from '@/lib/formatters/currency'
import { computeInvoiceBalance } from '../lib/invoiceBalance'
import { InvoiceStatusBadge } from '../components/InvoiceStatusBadge'
import { useInvoice } from '../hooks/useInvoice'
import { useIssueInvoice, useVoidInvoice } from '../hooks/useInvoiceMutations'

export function InvoiceDetailPage() {
  const { invoiceId = '' } = useParams()
  const { toast } = useToast()
  const organization = useCurrentOrganization()
  const canManage = hasPermission(organization?.yourRole, 'billing.manage')

  const { data: invoice, isLoading, error, refetch } = useInvoice(invoiceId)
  const { data: payments, isLoading: paymentsLoading } = usePaymentsForInvoice(invoiceId)

  const issueInvoice = useIssueInvoice(invoiceId)
  const voidInvoice = useVoidInvoice(invoiceId)
  const [voidOpen, setVoidOpen] = useState(false)

  if (isLoading) return <PageSpinner />
  if (error || !invoice) return <ErrorState error={error} onRetry={() => refetch()} />

  const balance = computeInvoiceBalance(invoice, payments)

  async function onIssue() {
    try {
      await issueInvoice.mutateAsync()
      toast({ title: 'Invoice issued', variant: 'success' })
    } catch (err) {
      toast({ title: 'Unable to issue invoice', description: err instanceof ApiError ? err.message : undefined, variant: 'error' })
    }
  }

  async function onVoid() {
    try {
      await voidInvoice.mutateAsync()
      toast({ title: 'Invoice voided', variant: 'success' })
      setVoidOpen(false)
    } catch (err) {
      toast({ title: 'Unable to void invoice', description: err instanceof ApiError ? err.message : undefined, variant: 'error' })
    }
  }

  const canIssue = canManage && invoice.status === 'DRAFT'
  const canVoid = canManage && invoice.status !== 'VOID' && invoice.status !== 'PAID'

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold">Invoice {invoice.invoiceNumber}</h1>
            <InvoiceStatusBadge status={invoice.status} />
          </div>
          <p className="text-sm text-muted-foreground">
            Residency:{' '}
            <Link to={`/app/residencies/${invoice.residencyId}`} className="underline underline-offset-2">
              {invoice.residencyId.slice(0, 8)}
            </Link>
          </p>
        </div>
        <div className="flex gap-2">
          {canIssue && (
            <Button isLoading={issueInvoice.isPending} onClick={onIssue}>
              Issue invoice
            </Button>
          )}
          {canVoid && (
            <Button variant="outline" className="text-destructive" onClick={() => setVoidOpen(true)}>
              Void invoice
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Billing period</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm">
            {new Date(invoice.billingPeriodStart).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
            {' — '}
            {new Date(invoice.billingPeriodEnd).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">Due {new Date(invoice.dueDate).toLocaleDateString()}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Amount</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="divide-y divide-border">
            {invoice.items?.map((item) => (
              <div key={item.id} className="flex items-center justify-between py-2 text-sm">
                <span>{item.description}</span>
                <span className="font-medium">{formatCurrency(item.amount, invoice.currency)}</span>
              </div>
            ))}
          </div>
          <div className="space-y-1 border-t border-border pt-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{formatCurrency(invoice.subtotal, invoice.currency)}</span>
            </div>
            {Number(invoice.discount) > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Discount</span>
                <span>-{formatCurrency(invoice.discount, invoice.currency)}</span>
              </div>
            )}
            {Number(invoice.tax) > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tax</span>
                <span>{formatCurrency(invoice.tax, invoice.currency)}</span>
              </div>
            )}
            <div className="flex justify-between text-base font-semibold">
              <span>Total</span>
              <span>{formatCurrency(invoice.total, invoice.currency)}</span>
            </div>
          </div>
          <div className="space-y-1 border-t border-border pt-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Paid</span>
              <span className="font-medium text-success">
                {paymentsLoading ? '…' : formatCurrency(balance.paid, invoice.currency)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Outstanding</span>
              <span className="font-medium">{paymentsLoading ? '…' : formatCurrency(balance.outstanding, invoice.currency)}</span>
            </div>
            {balance.isApproximate && (
              <p className="pt-1 text-xs text-muted-foreground">
                Estimated from completed payments — pg-backend does not yet expose an exact paid/outstanding
                figure on the invoice itself.
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Payments</CardTitle>
        </CardHeader>
        <CardContent>
          {paymentsLoading ? (
            <p className="text-sm text-muted-foreground">Loading payments…</p>
          ) : !payments || payments.length === 0 ? (
            <p className="text-sm text-muted-foreground">No payments recorded for this invoice yet.</p>
          ) : (
            <div className="divide-y divide-border">
              {payments.map((payment) => (
                <div key={payment.id} className="flex items-center justify-between py-2 text-sm">
                  <div>
                    <p className="font-medium">{formatCurrency(payment.amount, payment.currency)}</p>
                    <p className="text-xs text-muted-foreground">
                      {payment.paidAt ? new Date(payment.paidAt).toLocaleString() : new Date(payment.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <PaymentStatusBadge status={payment.status} />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={voidOpen}
        onClose={() => setVoidOpen(false)}
        onConfirm={onVoid}
        title="Void this invoice?"
        description="This cannot be undone. The invoice will no longer be payable."
        confirmLabel="Void invoice"
        isLoading={voidInvoice.isPending}
      />
    </div>
  )
}
