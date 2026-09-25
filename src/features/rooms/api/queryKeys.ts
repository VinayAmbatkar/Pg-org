export const roomKeys = {
  all: ['rooms'] as const,
  lists: (propertyId: string) => [...roomKeys.all, 'list', propertyId] as const,
  detail: (propertyId: string, roomId: string) => [...roomKeys.all, 'detail', propertyId, roomId] as const,
  history: (propertyId: string, roomId: string) => [...roomKeys.all, 'history', propertyId, roomId] as const,
}
