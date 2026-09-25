export const tenantKeys = {
  all: ['tenants'] as const,
  detail: (id: string) => [...tenantKeys.all, 'detail', id] as const,
}
