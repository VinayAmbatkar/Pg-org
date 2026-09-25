export const rentPlanKeys = {
  all: ['rent-plans'] as const,
  forResidency: (residencyId: string) => [...rentPlanKeys.all, 'residency', residencyId] as const,
}

export const invoiceKeys = {
  all: ['invoices'] as const,
  listForProperty: (propertyId: string) => [...invoiceKeys.all, 'property', propertyId] as const,
  detail: (id: string) => [...invoiceKeys.all, 'detail', id] as const,
}
