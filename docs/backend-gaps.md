# Backend Gaps

Every gap below was confirmed by reading the actual pg-backend controllers/DTOs/Prisma schema
(not just its README), and every workaround described here was explicitly approved by the
product owner before implementation. None of these are invented endpoints — they're real
limitations of the backend as it stands today.

## 1. No way to read bed occupancy or "current room/bed" after the fact

**Feature affected:** Room/Bed UI (beds), Tenant 360 / Residency detail.

**Current backend support:** `POST /residencies/:id/check-in` and `POST /residencies/:id/check-out`
return `{ residency, allocation }` — the only two places a `BedAllocation` object is ever visible.

**Missing endpoint/capability:** There is no `GET` for `BedAllocation` at all — no
"list allocations for a bed," no "get current allocation for a residency." `Bed.status` is a
service-state flag (`AVAILABLE | INACTIVE | ARCHIVED`), not occupancy — an `AVAILABLE` bed may or
may not actually have someone in it.

**Expected contract:** Either (a) `GET /properties/:propertyId/beds` (or the existing beds list)
should include the current active allocation's residency/tenant id if any, or (b)
`GET /residencies/:id` should include the current active `BedAllocation` if one exists.

**Why the frontend can't safely implement it:** There's no query to run — the data simply isn't
retrievable via any GET request once the check-in/check-out response has been consumed.

**Workaround shipped in Phase 1 (approved):** `src/features/residency/api/allocationCache.ts`
caches whatever allocation a check-in/check-out response returns, keyed by both `bedId` and
`residencyId`, for the rest of the browser session. Bed cards and the Tenant 360 page show this
cached info when present, and an honest "not available until the next check-in/check-out"
fallback when it isn't (e.g. after a page reload). This is explicitly a best-effort UX aid, not a
source of truth.

**Phase recommendation:** High priority for Phase 2 backend work — this blocks a real "who's in
this bed" view and any occupancy reporting.

## 2. No tenant search, list, or "create tenant for someone else" endpoint

**Feature affected:** Tenants module, "Add Tenant" flow, Tenant 360.

**Current backend support:** `POST /tenants` (no body) creates a tenant profile for the **caller
only**. `GET /tenants/:id` returns `{id, userId, createdAt}` — no name/phone/email, and no way to
look one up except by an exact, already-known id.

**Missing endpoint/capability:** No `GET /tenants` list, no search by name/phone, and no
Owner/Manager-facing "create a tenant profile for this person" endpoint.

**Expected contract:** An endpoint like `POST /tenants/invite` or
`POST /organizations/:id/tenants` that lets an Owner/Manager create or link a tenant profile for
an existing platform `User` (found via phone/email lookup), plus a `GET /properties/:id/tenants`
or similar for real search/list support.

**Why the frontend can't safely implement it:** Building a "search for a tenant" UI against a
backend with no search endpoint would just be a fake input with no working query behind it.

**Workaround shipped in Phase 1 (approved):** The tenant list is built by reading
`GET /properties/:propertyId/residencies` (each residency implies one tenant's stay) and, where
needed, `GET /tenants/:id` per unique `tenantId`. Residency creation requires the Owner to type in
an already-known Tenant ID manually, with a clear in-UI note that this is a stopgap.

**Phase recommendation:** High priority for Phase 2 — this is the biggest usability gap in the
whole Owner Web experience today.

## 3. No org membership / invite endpoints

**Feature affected:** Team management, MANAGER/STAFF onboarding.

**Current backend support:** `POST /organizations` creates an org and grants the caller `OWNER`
atomically. There is no `memberships` controller at all — `MembershipsService` is an internal
authorization helper only, never exposed over HTTP.

**Missing endpoint/capability:** No way to list an organization's members, no invite/accept flow,
no way for anyone to become `MANAGER` or `STAFF` of an org they didn't create.

**Why the frontend can't safely implement it:** There's no team/invite UI to build against —
MANAGER and STAFF roles are unreachable through any current API path. This also blocks a proper
"assign to" picker in Phase 2's Complaints module (`POST /complaints/:id/assign` takes a raw
`assignedToUserId` with nothing to look it up against) — see `docs/complaints.md`.

**Workaround shipped in Phase 1:** No team management UI was built. The permission system
(`src/infrastructure/permissions/permissions.ts`) is written to support MANAGER/STAFF roles the
moment the backend can produce them, but only OWNER is exercised in practice today.

**Phase recommendation:** Needed before Phase 2 can deliver any multi-user workflows.

## 4. No pagination, sort, or search on Properties/Rooms/Beds list endpoints

**Feature affected:** Properties list, Rooms list, Beds list.

**Current backend support:** `GET /properties` supports only `?organizationId=`. `GET
/properties/:id/rooms` and `GET .../rooms/:id/beds` accept no query params at all.

**Workaround shipped in Phase 1:** Client-side search/filtering over the already-fetched list.
Acceptable at the scale of one organization's properties today; will not scale to hundreds of
rows.

**Phase recommendation:** Add standard pagination/search params before property counts grow large.

## 5. No computed occupancy/counts on Property or Room responses

**Feature affected:** Dashboard, Property list "Rooms/Beds/Occupancy" columns.

**Current backend support:** `PropertyResponseDto`/`RoomResponseDto` carry no room/bed/occupancy
counts.

**Workaround shipped in Phase 1:** Computed client-side by fetching child collections (rooms per
property, beds per room). The Dashboard is scoped to the currently-selected property (via the
property switcher) rather than aggregating across every property in an org, to avoid an
unbounded fan-out of requests — see `src/features/dashboard/hooks/usePropertySummary.ts`.

**Phase recommendation:** A `GET /properties/:id/summary` (or embedded counts on the list
response) would remove the need for this client-side fan-out entirely.

## 6. Notifications are poll-only — no real-time channel

**Feature affected:** Notification bell.

**Current backend support:** REST only. No WebSocket gateway exists in the notifications module.
The `PUSH` channel exists for Expo device token registration but all non-`IN_APP` channels
(`PUSH`/`EMAIL`/`WHATSAPP`/`SMS`) currently no-op server-side.

**Workaround shipped in Phase 1:** The bell polls `GET /me/notifications/unread-count` on a
30-second interval (`src/features/notifications/hooks/useUnreadCount.ts`).

**Phase recommendation:** Low priority for Owner Web; a websocket/SSE channel would improve
perceived responsiveness but isn't blocking.

## 7. Invoice responses carry no paid/outstanding amount

**Feature affected:** Invoices list, Invoice detail (`src/features/billing`).

**Current backend support:** `InvoiceResponseDto` (`pg-backend/src/modules/invoices`) has
`subtotal`/`discount`/`tax`/`total`/`status` but no `amountPaid`/`outstandingAmount`/`balance`
field. `PARTIALLY_PAID`/`PAID` are set correctly server-side (by the payments module's
`finalizeCapturedPayment`), so the *status* is authoritative — only the numeric split isn't
exposed.

**Missing endpoint/capability:** No field on the invoice itself, and no dedicated
"invoice balance" endpoint.

**Expected contract:** Add `amountPaid`/`outstandingAmount` (both decimal strings, server-computed
from `PaymentAllocation`) to `InvoiceResponseDto`.

**Why the frontend can't safely implement it:** For `ISSUED`/`OVERDUE`/`PAID`/`VOID` the exact
figure can be derived from `status` + `total` alone (see `src/features/billing/lib/invoiceBalance.ts`
for the exact reasoning). For `PARTIALLY_PAID` there is no exact source: summing this invoice's
`CAPTURED` payments (`GET /invoices/:invoiceId/payments`) undercounts if any of those payments were
later *partially* refunded, because `PaymentResponseDto.amount` always stays the original gross
amount — the refunded portion isn't exposed anywhere on the payment.

**Workaround shipped in Phase 2 (approved):** `computeInvoiceBalance()` derives paid/outstanding
from `status` where that's exact, and falls back to summing `CAPTURED` payments (flagged
`isApproximate: true`) only for `PARTIALLY_PAID`. The Invoice Detail page shows a small disclosure
note whenever the approximate path is used.

**Phase recommendation:** Add the two fields server-side before Phase 3 — this is the only
financial figure in the app that isn't backend-exact today.

## 8. No "list all rent plans for a property" endpoint

**Feature affected:** Rent Plans page (`src/features/billing/pages/RentPlansPage.tsx`).

**Current backend support:** `GET /residencies/:residencyId/rent-plan` returns only the current
`ACTIVE` plan for **one** residency. There is no property-wide or history-inclusive list endpoint.

**Missing endpoint/capability:** `GET /properties/:propertyId/rent-plans` (all residencies, current
plan each) and/or `GET /residencies/:residencyId/rent-plans` (full history, including `INACTIVE`
ones) do not exist.

**Expected contract:** A property-scoped list endpoint returning each residency's current rent
plan in one call, to avoid fanning out.

**Why the frontend can't safely implement it well:** The only way to build a property-wide table
today is to fetch every residency for the property, then call the per-residency endpoint for each
one — an N+1 pattern that is fine at typical PG scale (tens of residencies) but won't scale to a
property with hundreds.

**Workaround shipped in Phase 2 (approved):** `useRentPlansForProperty` fans out one request per
active/notice-period residency via `useQueries`. Rent-plan *history* (prior `INACTIVE` plans) is
not shown at all — only the current plan per residency — since no endpoint returns it.

**Phase recommendation:** Add the property-scoped list endpoint before property sizes grow large
enough for the fan-out to matter.

## 9. No pagination/filter/search on invoices or rent-plan-adjacent list endpoints

**Feature affected:** Invoices list (`GET /properties/:propertyId/invoices`), payments list
(`GET /invoices/:invoiceId/payments`).

**Current backend support:** Both endpoints return the full unfiltered array — no `status`,
`search`, `page`, or `limit` query params, unlike the `PaginatedResult<T>` convention used
elsewhere (e.g. complaints, notifications).

**Workaround shipped in Phase 2 (approved):** Status/search filtering on the Invoices list happens
client-side over the full fetched array, consistent with the same tradeoff already made for
Properties in Phase 1.

**Phase recommendation:** Bring these two endpoints in line with the `PaginatedResult<T>`
convention once invoice/payment volume grows.

## 10. No "list all payments for a property/org" endpoint

**Feature affected:** Payments list (`src/features/payments/pages/PaymentsListPage.tsx`).

**Current backend support:** `GET /invoices/:invoiceId/payments` only — scoped to one invoice.
There is no `GET /properties/:propertyId/payments` or `GET /organizations/:id/payments`.

**Expected contract:** A property- or org-scoped payments list endpoint (ideally paginated,
filterable by status/date).

**Why the frontend can't safely implement it well:** The only way to build a property-wide
payments table today is to fetch every invoice for the property, then call the per-invoice
payments endpoint for each one — another N+1 pattern.

**Workaround shipped in Phase 2 (approved):** `usePaymentsForProperty` fans out one request per
invoice via `useQueries`, flattens and sorts the results client-side. **Phase 3:** the Payments page is
now bounded to a billing-period window (`?months=1|3|6|12`, default 3) and skips DRAFT invoices,
because an unbounded fan-out trips pg-backend's 100 req/min throttle at roughly 100 invoices.

**Phase recommendation:** Add the property/org-scoped list endpoint — this is the same shape of
gap as #8 (rent plans) and will compound as invoice volume grows.

## 11. `GET /properties/:propertyId/food/menus/week` query contract unverified

**Feature affected:** Weekly Menu (`src/features/food/pages/WeeklyMenuPage.tsx`).

**Current backend support:** The backend survey confirmed this route exists and confirmed the
`PUT` body shape (`WeeklyMenuDto{days: [{date, items[]}]}`), but did not confirm the `GET`
variant's query parameters (e.g. a `weekStart` date).

**Workaround shipped in Phase 2 (approved):** `WeeklyMenuPage` avoids guessing an unverified query
contract — it composes the same 7-day view from the already-documented
`GET /properties/:propertyId/food/menus?from=&to=` instead, and renders read-only (day-by-day
editing happens on the Daily Menu page). The `PUT .../week` bulk-save endpoint is not wired to any
UI yet.

**Phase recommendation:** Confirm the `GET .../week` query contract, then wire `PUT .../week` into
an inline weekly editor as a follow-up — bulk-editing a week one day at a time is the main
remaining UX gap in the Food module.

---

The gaps below were found while building Phase 3 (dashboard intelligence, 360 views, search,
alerts, notifications, bulk operations). Each was verified against pg-backend's controllers,
DTOs and services. File/line references are to `pg-backend/src`.

## 12. No owner-facing analytics, aggregates or history

**Feature affected:** Dashboard, Property 360.

**Current backend support:** Every aggregate endpoint (`GET /admin/dashboard`,
`/admin/analytics/overview|revenue|occupancy|tenant-payments`) is behind `PlatformAdminGuard`
(`platform-analytics.controller.ts:21-23`), SUPER_ADMIN only and platform-wide.

**Missing:** Org/property-scoped summaries (occupancy, collection, counts) and any time series.

**Frontend approach:** All figures are derived from list endpoints (`dashboard/lib/metrics.ts`).
**No trend/history chart is shown**, because there's no historical data; the Occupancy card says
so. No conversion rates and no "health score" are shown either.

**Recommendation:** `GET /organizations/:id/summary?propertyId=` returning occupancy, billing and
pipeline counts, plus a daily occupancy snapshot table for trends.

## 13. Dashboard cost scales with room count (and the throttle)

A dashboard load is about `21 + rooms` requests (rooms, **one beds request per room**, residencies,
invoices, 6 complaint counts, 4 application counts, visits, food, notifications, auth). With the
global 100 req/min throttle (`app.module.ts:64-71`), a property with ~80 rooms could see 429s on a
cold load. Beds responses are cached (30s) and shared with Rooms & Beds, so warm navigation is
cheap. A property-level beds list or the summary endpoint in §12 would remove the fan-out.

## 14. Only complaints are searchable; no global search

**Current support:** `search` exists only on `GET /complaints` (`complaints.service.ts:305-308`).
No list endpoint accepts `q`, and there is no cross-entity search.

**Frontend approach:** The command palette (Ctrl/Cmd+K) combines pages/actions, server-side
complaint search, and client-side matching over lists the app already loads: properties, the
current property's rooms and invoices, and the 100 most recent applications. The footer names the
property those searches are scoped to.

## 15. No tenant identity for owners

**Current support:** `TenantResponseDto` is `{id, userId, createdAt}` and there is no users
endpoint (`tenants.service.ts:46-76`). Residencies carry no tenant name, room or bed.

**Frontend approach:** Tenant 360 shows name/phone **only** when a real link exists:
`Tenant.userId === Application.applicantUserId` on an APPROVED application (100 most recent). Otherwise it
shows the ID with an explanation. The Tenants list stays ID-based (resolving names per row would be
a per-tenant fan-out).

**Recommendation:** Include `tenant: {name, phone}` (owner-visible) on residency responses.

## 16. No owner-facing activity / audit trail

**Current support:** Audit logs are exposed only at `GET /admin/audit-logs` (SUPER_ADMIN). Only
complaints have an activity feed (`GET /complaints/:id/activity`).

**Frontend approach:** Tenant 360 "Activity" and the dashboard "Recent Activity" are built from
real record timestamps only (stay created, stay start date, invoice issued, payment captured,
complaint reported, application submitted), each labelled as exactly what the timestamp records.
Nothing is inferred (e.g. `startDate` is not labelled "checked in").

## 17. No bulk operations (except weekly menu upsert)

**Current support:** The only bulk write is `PUT /properties/:propertyId/food/menus/week`
(`food-menus.controller.ts:76`), plus `POST /me/notifications/read-all`. There is no bulk invoice
generate/issue/void and no bulk complaint update.

**Frontend approach:** None simulated. Firing N single requests would be non-atomic, would give
partial-failure states the backend can't reconcile, and would hit the throttle.

**Recommendation:** `POST /properties/:id/invoices/generate {year, month}` (all active residencies,
idempotent per billing period) and `POST /invoices/issue {ids[]}` are the highest-value bulk
endpoints.

## 18. Visits list has no status/date filter

`GET /properties/:propertyId/visits` accepts only `page`/`limit` and sorts by `createdAt`.
"Upcoming visits" is filtered client-side from the 100 most recent, so a visit created long ago
but scheduled far ahead could be missed. Recommendation: `status`, `from`, `to`, `sortBy=scheduledStartAt`.

## 19. Complaints can't be filtered by residency

Tenant 360's complaints and activity filter the property's 100 most recent complaints by
`residencyId` client-side. Recommendation: add `residencyId` to `ListComplaintsQueryDto`.

## 20. Notifications: owner-relevant metadata and the `unreadOnly` coercion

- Notification responses omit `propertyId` (stored, not returned), so they can't be filtered per
  property. Deep links use `data.screen` + ids and are validated as UUIDs before use.
- `unreadOnly` uses implicit boolean conversion, so `unreadOnly=false` returns **unread only**
  (`list-notifications.query.dto.ts:13`). The frontend omits the param for "all".
- Owners receive only APPLICATION_SUBMITTED, VISIT_NO_SHOW, COMPLAINT_CREATED, COMPLAINT_ASSIGNED
  and (OWNER) SAAS_*. There's no invoice-overdue notification for owners; the dashboard alert
  covers that.

## 21. Refresh token must live in JS-readable storage

`POST /auth/refresh` takes the token in the JSON body; the backend never sets cookies. So the
refresh token has to live in `localStorage`, readable by any script that achieves XSS. Mitigations
are in `docs/security.md`. Recommendation: an httpOnly, `SameSite=Strict`, `Secure` refresh cookie
on `/auth/refresh`.

## 22. ~~Rooms carry no price, amenities, photos or occupancy~~ — RESOLVED (backend Phase 13)

pg-backend migration `20261019090000_phase13_room_details` added, all additive:

- **Room:** `pricePerBed` (Decimal, advertised rate — tenants are still billed by their RentPlan),
  `currency`, `amenities` (`RoomAmenity[]`: AC, WIFI, TV, FAN, ALMARI, STUDY_TABLE,
  ATTACHED_WASHROOM, GEYSER, BALCONY; "Non-AC" = no AC), `imageUrl` (http(s) link — there is still
  no upload service), `description`.
- **Room responses** include `occupancy: {totalBeds, occupiedBeds, vacantBeds, blockedBeds}`,
  computed from ACTIVE bed allocations in two queries for the whole list.
- **Bed:** optional `berth` (LOWER/UPPER); **bed responses** include `occupant`
  (`{residencyId, tenantId, name, phone, since, monthlyRent, currency}` or null).
- **New:** `GET /properties/:propertyId/rooms/:roomId/history` — check-in/out history for the room's
  beds (max 100, newest first), same access as the room.

This also resolves **§1** for rooms/beds (who is in each bed is now readable), removes the
per-room beds fan-out from the dashboard (**§13** — occupancy now comes from the room list alone),
and gives owners tenant names/phones for occupied beds (**§15**, partially: residency responses
still carry no name).

Still missing: file upload for room photos, server-side room filtering/pagination (filters run
client-side over the full room list), and a per-bed price (price is per room).
