export const paymentKeys = {
  all: ['payments'] as const,
  listForInvoice: (invoiceId: string) => [...paymentKeys.all, 'invoice', invoiceId] as const,
  detail: (id: string) => [...paymentKeys.all, 'detail', id] as const,
}
