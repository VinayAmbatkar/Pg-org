# Architecture

PGMet Owner/Manager Web is a feature-oriented React + TypeScript + Vite application.

```text
src/
├── app/            # bootstrapping: config, layouts, providers, router, route guards
├── features/       # one folder per business domain — Phase 1: auth, onboarding, dashboard,
│                   # organizations, properties, rooms, beds, tenants, residency, notifications.
│                   # Phase 2: billing, payments, complaints, food, applications, visits.
│                   # Phase 3: alerts (operational alerts), search (command palette).
│   └── <feature>/
│       ├── api/          # axios calls + TanStack Query key factories, 1:1 with backend routes
│       ├── components/   # feature-specific UI
│       ├── hooks/         # useQuery/useMutation wrappers
│       ├── pages/         # route-level components
│       ├── schemas/        # zod schemas mirroring backend DTOs exactly
│       └── types/         # request/response payload shapes
├── components/     # cross-feature UI: ui/ (design system primitives), data-table/ (DataTable,
│                   # FilterBar, SearchInput), data-display/ (MetricCard, StatusBadge), layout/,
│                   # feedback/ (toast, empty/error states, QueryState, ErrorBoundary, ConfirmDialog),
│                   # navigation/
├── infrastructure/ # api client + interceptors, auth session, permission matrix
├── lib/            # formatters, validators, status/statusConfig, utils (cn, listParams)
├── types/          # shared API types mirroring the backend's Prisma enums/DTOs
└── test/           # MSW handlers/server + response helpers, renderWithProviders, renderApp
e2e/                # Playwright specs + deterministic mock backend (see docs/e2e.md)
```

## Why this shape

- **Features own their vertical slice.** A feature's api/hooks/pages/schemas/types live together
  so a change to how Properties are fetched never touches Rooms.
- **`infrastructure/` is the only place that knows about tokens, refresh, and role math.**
  Features never call `axios` directly or decode a JWT — they import `apiClient` and
  `hasPermission`.
- **`components/ui` is a small, hand-built shadcn-style primitive set** (Button, Input, Select,
  Card, Badge, Dialog, Tabs, Skeleton) built with `class-variance-authority` + Tailwind, not a
  generated library — kept intentionally small and consistent rather than pulling in a full
  component framework.
- **One `DataTable`** (`src/components/data-table/DataTable.tsx`) handles loading/empty/error/
  pagination for every list view; feature pages only supply columns and a row renderer.

## Data flow

Server state (properties, rooms, beds, tenants, residencies, notifications) lives entirely in
TanStack Query, keyed by per-feature `queryKeys.ts` factories. Zustand
(`src/app/providers/uiStore.ts`) holds only client-owned UI state: which organization/property is
"current" for the session, and sidebar collapse — never a copy of server data.

## Phase 2 pattern: composed property-wide views

Several backend endpoints only ever scope to "one residency" or "one invoice" — there's no
property- or org-wide list for rent plans, payments, or a residency-filtered complaints/food view
(see `docs/backend-gaps.md`). Rather than fake a list endpoint or silently show incomplete data,
these views are composed client-side with TanStack Query's `useQueries`, fanning out one request
per parent record (e.g. `useRentPlansForProperty`, `usePaymentsForProperty`). This is documented
as an explicit, approved tradeoff in each case — acceptable at typical PG scale, flagged in
`docs/backend-gaps.md` as something that should move server-side once record counts grow.

## Phase 2 pattern: 360 views are composition, not new backend concepts

"Tenant 360" (`ResidencyDetailPage`'s Rent/Invoices/Payments/Complaints/Food tabs) and "Property
360" (`PropertyDetailPage`'s equivalent tabs) don't introduce any new backend-facing data — they
compose the same hooks each dedicated module page already uses, scoped down by `residencyId` or
`propertyId`. This keeps a single source of truth per data type (one `useInvoicesForProperty`
hook, reused and filtered, rather than a parallel "tenant invoices" hook) and means a bug fix in
one place fixes it everywhere that data is shown.

## Routing

`src/app/router/routes.tsx` defines the full route tree with `React.lazy` per feature page.
`RequireAuth` gates everything past login; `RequireOrganization` gates everything under `/app`
(there is no way to operate without an organization); `RequirePermission` gates each module's
route group (see `docs/permissions.md`).

**One path table.** `src/app/router/paths.ts` (`APP_SEGMENTS` / `APP_PATHS`) is the single source
for module paths; the router and the sidebar both read it. This is the fix for the Phase 3 P0 bug:
the sidebar's "Rooms & Beds" item was hard-coded to `/app/properties` and no Rooms & Beds route
existed, so it silently opened the Properties list. `/app/rooms` now exists, scoped to the header's
current property like `/app/tenants`, and `routes.test.tsx` fails if any sidebar target doesn't
resolve to a real, non-catch-all route.

**Error boundaries.** Three layers: `GlobalErrorBoundary` around the whole app (last resort,
reload), `RouteErrorBoundary` as `errorElement` on every module route group (a page that throws,
or whose lazy chunk fails after a deploy, shows a recovery screen *inside* the shell), and
`SectionBoundary` around independent sections (dashboard cards, 360 tab panels, charts) so one
failing section never blanks its page. Query errors don't throw: each section renders its own
error state with a retry (`QueryState`, `DashboardCard`, `DataTable`). Unknown `/app/*` paths
render an in-shell 404.

## Phase 3 pattern: derived operational intelligence

pg-backend exposes no owner-facing aggregates (its `/admin/analytics/*` routes are SUPER_ADMIN
only), so every dashboard / Property 360 figure is derived client-side from real list responses:

- `src/features/dashboard/lib/metrics.ts`: pure, unit-tested definitions. `computeOccupancy`
  compares in-service beds with ACTIVE/NOTICE_PERIOD stays (`AVAILABLE` means *in service*, not
  vacant). `computeRentCollection` gives billed / paid-in-full for this month, exact outstanding,
  and overdue using the backend's lazy-OVERDUE rule; partially-paid balances are reported
  separately, never guessed.
- `src/features/dashboard/hooks/useOperationalData.ts`: one hook per domain (`useOccupancy`,
  `useRentCollection`, `useComplaintCounts`, `useApplicationPipeline`). They share query keys with
  the module pages, so the dashboard, Property 360, alerts and the modules reuse one cache entry.
- `src/features/alerts/`: `buildAlerts` turns those snapshots into prioritized, deep-linked alerts
  and never raises an alert from a domain that failed or is still loading.

Deliberately **not** built, because the data doesn't exist: historical/trend charts, conversion
rates, a "health score", tenant activity beyond real record timestamps. See
`docs/backend-gaps.md` §12 onward.

## Phase 3 pattern: one status system

`src/lib/status/statusConfig.ts` maps every backend status (13 domains) to label + variant +
optional icon, and `StatusBadge` renders it. Feature badges (`InvoiceStatusBadge`, ...) are thin
wrappers kept for call-site stability. Add a status there, not an `if (status === ...)`.
