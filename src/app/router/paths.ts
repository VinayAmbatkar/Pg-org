// Single source of truth for the top-level /app module paths. The router (routes.tsx) and the
// sidebar (Sidebar.tsx) both read from here, so a nav item can never point at a path the router
// doesn't define — the root cause of the Phase 3 "Rooms & Beds opens the wrong page" bug, where the
// sidebar item was hard-coded to /app/properties and no Rooms & Beds route existed at all.
export const APP_BASE = '/app'

export const APP_SEGMENTS = {
  dashboard: 'dashboard',
  properties: 'properties',
  rooms: 'rooms',
  tenants: 'tenants',
  billing: 'billing',
  payments: 'payments',
  complaints: 'complaints',
  food: 'food',
  applications: 'applications',
  visits: 'visits',
  notifications: 'notifications',
  settings: 'settings',
} as const

export type AppModule = keyof typeof APP_SEGMENTS

export const APP_PATHS = Object.fromEntries(
  Object.entries(APP_SEGMENTS).map(([key, segment]) => [key, `${APP_BASE}/${segment}`]),
) as { [K in AppModule]: `/app/${(typeof APP_SEGMENTS)[K]}` }
