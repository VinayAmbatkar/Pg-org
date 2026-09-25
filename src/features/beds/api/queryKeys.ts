export const bedKeys = {
  all: ['beds'] as const,
  lists: (propertyId: string, roomId: string) => [...bedKeys.all, 'list', propertyId, roomId] as const,
}
