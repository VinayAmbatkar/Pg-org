# Performance

Measure first. The figures below come from `npm run build` output and from counting MSW requests
per page in the integration environment (Phase 3, 2026-09-25).

## Bundle

- **Route-level splitting:** every page is `React.lazy` in `routes.tsx`. The entry chunk
  (`index-*.js`, ~381 kB / 119 kB gzip) holds React, React DOM, React Router, TanStack Query,
  Axios and the app shell. Zod (~123 kB / 37 kB gzip) lives in a shared `schemas` chunk that only
  form pages load.
- **Recharts isolated (Phase 3):** the only chart, the occupancy donut, is lazy-loaded inside
  `OccupancyCard`. Before, Recharts was bundled into the shared chunk the Dashboard *and every*
  Property 360 tab loaded:

  | Chunk | Before | After |
  | --- | --- | --- |
  | shared dashboard/360 chunk (`RentCollectionCard-*.js`) | 295.7 kB / 89.7 kB gzip | 14.7 kB / 5.0 kB gzip |
  | `OccupancyDonut-*.js` (Recharts), loaded only when the chart renders | inside the chunk above | 281.8 kB / 85.0 kB gzip |

  The legend numbers render immediately; the donut streams in after. Non-Overview Property 360
  tabs never download Recharts.
- No source maps are emitted in production builds (`dist/assets/*.map`: 0).

## Network

Measured request counts (fixture property with 1 room; includes auth bootstrap + unread count):

| Page | Requests | Duplicates |
| --- | --- | --- |
| Dashboard | 22 (= 21 + rooms) | 0 |
| Property 360 (Overview) | 22 | 0 |
| Tenant 360 | 9 (Phase 2: 9 + 1 + one per room, always) | 0 |
| Rooms & Beds | 7 | 0 |

What keeps this low:

- **Shared query keys.** Dashboard sections, alerts, Property 360 and module pages call the same
  hooks, so e.g. the invoices list is fetched once and reused. `staleTime` is 30s.
- **Fetch-on-need.** 360 tabs mount (and fetch) only when selected. The notification list only
  loads while the popover/history is open. Tenant 360 loads rooms + per-room beds only when the
  check-in dialog opens.
- **Bounded fan-outs.** pg-backend throttles at 100 req/min, and some views have no list endpoint
  and must fan out:
  - beds: one request per room, cached and shared with Rooms & Beds;
  - payments: one request per invoice. The Payments page is bounded to a billing-period window
    (default 3 months) and skips DRAFT invoices.
  See `docs/backend-gaps.md` §10 and §13 for the endpoints that would remove them.
- **Debounced server search.** Complaint search commits after 300 ms, and the palette after 200 ms
  and 2+ characters.
- **No retry storms.** 4xx, 409 and 429 are never retried (`queryClient.ts`).
- **No aggressive polling.** Only the unread count polls (30s, paused in background tabs).

## Rendering

Memoization is used where it's load-bearing, not by default. Derived snapshots are memoized on
their query data, and `useQueries` `combine` keeps fan-out results referentially stable, so
dependent memos don't recompute every render. `buildAlerts` and similar cheap derivations are
deliberately not memoized.
