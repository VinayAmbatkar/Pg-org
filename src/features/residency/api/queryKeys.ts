export const residencyKeys = {
  all: ['residencies'] as const,
  listForProperty: (propertyId: string) => [...residencyKeys.all, 'list', propertyId] as const,
  detail: (id: string) => [...residencyKeys.all, 'detail', id] as const,
}
