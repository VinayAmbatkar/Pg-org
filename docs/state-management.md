# State Management

Two tools, two clearly separated jobs — no Redux, no second server-state library.

## Server state — TanStack Query

Every piece of data that lives on the backend (organizations, properties, rooms, beds, tenants,
residencies, notifications) is fetched and cached through TanStack Query. Each feature has a
`api/queryKeys.ts` factory, e.g.:

```ts
propertyKeys.list({ organizationId }) // ['properties', 'list', { organizationId }]
propertyKeys.detail(id) // ['properties', 'detail', id]
```

Mutations invalidate the relevant keys on success (see `usePropertyMutations.ts`,
`useResidencyMutations.ts`, etc.) rather than manually patching cache shapes, except where a
mutation's response is directly usable (`queryClient.setQueryData` after an update).

Default query options live in `src/app/providers/queryClient.ts` (`createQueryClient`). The app
and the test helpers both use it, so tests exercise real cache behaviour: `staleTime` 30s, no
refetch on window focus, and no retries for `unauthorized` / `forbidden` / `not_found` /
`validation` / `conflict` / `rate_limited`. Retrying can't fix those, and retrying a 429 digs deeper
into pg-backend's 100 req/min throttle. Network blips and 5xx get two retries.

Polling is used in exactly one place: the notification unread count (30s, paused in background
tabs). The notification *list* is only fetched while the popover or history page is open.

Optimistic updates are used only for marking notifications read (with rollback). Payments,
invoices, check-in/out and other financial or occupancy mutations always wait for the server.

## Client state — Zustand

`src/app/providers/uiStore.ts` holds only UI state that has no server representation:

- which organization/property is "current" for the session (persisted to `localStorage` so a
  reload keeps your place)
- sidebar collapse state

It never caches or mirrors server data — properties, rooms, tenants, etc. are never duplicated
into Zustand.

## URL state

Search, pagination, filters, sort and active tabs live in the query string, so refresh and shared
links preserve the view: e.g. `/app/billing/invoices?status=OVERDUE&page=2`,
`/app/complaints?status=OPEN&sort=priority:desc`, `/app/residencies/:id?tab=activity`.

- `useUrlParams()` sets several keys atomically (e.g. a filter plus resetting `page`);
  `useUrlState` wraps one key. Both **push** history by default, so Back/Forward step through
  filter and page changes. Text search passes `{ replace: true }` and is debounced by `SearchInput`.
- Enum params are validated with `parseEnumParam` before use. A stale or hand-edited
  `?status=FOO` is ignored rather than forwarded (pg-backend rejects unknown values with 400).

## Property context

There is exactly one "current property": `currentPropertyId` in `uiStore`, resolved by
`useCurrentProperty` and changed by the header `PropertySwitcher`. Module pages (Rooms & Beds,
Tenants, Invoices, Payments, Complaints, Food, Applications, Visits) and the dashboard read it.
Opening a Property 360 or Tenant 360 page *writes* it (`useSyncCurrentProperty`), so their
"View all" links open that property's lists rather than whichever property the switcher held.

## Session state — React Context

`AuthProvider` (`src/infrastructure/auth/AuthProvider.tsx`) is a thin context wrapping the current
user, the organizations list, and session status (`restoring | authenticated | unauthenticated`).
It's a context rather than a Zustand store because it needs to orchestrate `QueryClient` calls
(fetching organizations into the query cache) and register a callback with the API client for
session-expiry handling — concerns that don't fit a plain state store.
