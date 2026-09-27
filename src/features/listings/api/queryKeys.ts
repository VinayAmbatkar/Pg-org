export const listingKeys = {
  all: ['listings'] as const,
  detail: (propertyId: string) => [...listingKeys.all, 'detail', propertyId] as const,
}
