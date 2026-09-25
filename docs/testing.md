# Testing

Stack: Vitest, React Testing Library, MSW (mocking the real HTTP boundary, not internal
functions), jsdom.

## Structure

- `src/test/setup.ts` — wires MSW's server into Vitest's lifecycle (`beforeAll`/`afterEach`/
  `afterAll`), plus `@testing-library/jest-dom` matchers.
- `src/test/handlers.ts` — MSW request handlers for the endpoints exercised by tests, built
  against the exact verified response shapes in `src/types/api.ts` (not invented fixtures).
- `src/test/server.ts` — the MSW node server instance.
- `src/test/renderWithProviders.tsx` — wraps a component under test with the same provider stack
  as the real app (`QueryClientProvider`, `ToastProvider`, `MemoryRouter`, `AuthProvider`) so
  feature code doesn't need special-casing for tests.

## What's covered

### Phase 1

- **Auth**: login success/failure, client-side validation before any network call
  (`src/features/auth/pages/LoginPage.test.tsx`), register schema's email-or-phone-required rule
  and password length (`src/features/auth/schemas/register.schema.test.ts`).
- **Permissions**: the full OWNER/MANAGER/STAFF matrix, including the "no role yet" case
  (`src/infrastructure/permissions/permissions.test.ts`).
- **Error normalization**: every status class maps to the right `kind` and never leaks a raw
  backend error body (`src/infrastructure/api/errors.test.ts`).

### Phase 2 — session reliability (the headline regression suite)

- `src/infrastructure/auth/AuthProvider.test.tsx` — reload restores an authenticated session, no
  stored refresh token → straight to unauthenticated, an invalid/revoked refresh token clears
  storage and lands on unauthenticated, a network failure during bootstrap refresh leaves the
  stored refresh token untouched, and — the regression test for the actual bug this phase fixed —
  React `StrictMode` double-invoking the bootstrap effect against a single-use rotated refresh
  token does not log the user out.
- `src/infrastructure/api/client.test.ts` — 401 → refresh → retry, concurrent 401s deduplicated
  into exactly one `/auth/refresh` call, an invalid refresh token clears the session and fires the
  expired handler, and a network failure during a runtime refresh does not clear a valid refresh
  token.

### Phase 2 — business modules

Each of the following has at least one test exercising its real HTTP contract through MSW handlers
in `src/test/handlers.ts` (fixtures built from the exact verified backend response shapes — see
each module's own `docs/*.md`, not invented data):

- **Billing** (`src/features/billing/pages/*.test.tsx`): invoice list load + client-side status
  filter + row navigation; invoice detail's amount breakdown, the derived paid/outstanding split
  for a `PARTIALLY_PAID` invoice, and issuing a `DRAFT` invoice.
- **Payments** (`src/features/payments/pages/*.test.tsx`): the property-wide payments view
  composed across every invoice; gross/platform-fee/owner-settlement shown as three separate
  figures on the detail page; refunding a captured payment.
- **Complaints** (`src/features/complaints/pages/*.test.tsx`): list rendering with
  category/priority/status; only the backend-valid transitions are offered for an `OPEN`
  complaint; assigning by user ID.
- **Food** (`src/features/food/pages/*.test.tsx`): configuration reflects the fetched state and
  gates Save on an actual change; the daily menu groups items by meal type and shows Publish only
  for `DRAFT`.
- **Applications** (`src/features/applications/pages/*.test.tsx`): applicant detail and the
  visible actions for `UNDER_REVIEW`; approving does **not** itself create a residency (asserts
  the "Start onboarding" button appears instead of any auto-navigation); starting onboarding
  returns a `tenantId` and links to the manual check-in step.
- **Visits** (`src/features/visits/pages/*.test.tsx`): the Complete/Reschedule/No-show/Cancel
  actions shown only for a `SCHEDULED` visit; completing and cancelling a visit update the row
  in place (not just a toast) without waiting on a refetch.
- **Tenant 360** (`src/features/residency/pages/ResidencyDetailPage.test.tsx`): the Rent and
  Invoices tabs show data scoped to that one residency.
- **Property 360** (`src/features/properties/pages/PropertyDetailPage.test.tsx`): the Billing and
  Complaints tabs show data scoped to that one property.
- **Dashboard** (`src/features/dashboard/pages/DashboardPage.test.tsx`): Open Complaints / Pending
  Applications show real counts from the fetched data, not placeholders; an `ISSUED` invoice whose
  due date has already passed is bucketed under "Overdue Invoices," not "Upcoming Payments" —
  this test caught a real bug (a missing lower-bound check in the upcoming-payments filter) before
  it shipped, in both `DashboardPage` and `BillingOverviewPage`.

Run `npm test` for a single pass, or `npm run test:watch` during development.

## Conventions

- Tests hit the real HTTP layer through MSW rather than mocking `propertiesApi`/`authApi`
  functions directly, so a test failure means the actual request/response contract broke, not
  just an internal implementation detail.
- Every new mutation-bearing page should have at least one test for its success path and one for
  its most likely conflict (e.g. a 409 from check-in).
- When a mutation hook only `invalidateQueries` (no `setQueryData`), the MSW handler backing the
  triggered refetch must be **stateful** (reflect the mutation), not a fixed fixture — a static
  handler will silently revert an optimistic-looking UI update in the test even though production
  behavior would be correct. Prefer `setQueryData` with the mutation response for anything a test
  will assert on, both for snappier real-world UX and to avoid this trap.

## Phase 3 coverage

Run `npm test` (Vitest + RTL + MSW) and `npm run test:e2e` (Playwright; see `docs/e2e.md`).

| Area | Tests |
| --- | --- |
| **Rooms & Beds routing (P0)** | `src/app/router/routes.test.tsx`: every sidebar target resolves to a real route; click → URL + page; direct URL; refresh (session restored from refresh token); STAFF view-only; role without `rooms.view` gets no nav + access-denied; unauthenticated → login |
| **Auth / session** | `src/app/authFlow.test.tsx`: login → dashboard → reload; mid-session 401 → refresh → original request succeeds (no duplicate fetch); invalid refresh → login; post-login redirect keeps query; logout. `crossTab.test.tsx`: cross-tab refresh lock uses the rotated token; logout in another tab. Plus the Phase 2 `AuthProvider` / `client` suites |
| **API error experience** | `src/app/apiErrorStates.test.tsx`: loading, 403, 404, 500 (no internals leaked), network → retry recovers, 429, unknown URL enum ignored, in-shell 404. `errors.test.ts`: code-specific 409 copy, timeout vs offline, field errors. `queryClient.test.ts`: retry policy |
| **Dashboard** | `DashboardPage.test.tsx`: correct derived metrics, alerts with deep links, overdue vs due-soon, no fabricated trend chart, per-domain error isolation, empty org, STAFF actions. `metrics.test.ts`, `buildAlerts.test.ts` |
| **Property 360** | `PropertyDetailPage.test.tsx`: health overview, sets current property, tab error ≠ empty, keyboard tabs, STAFF actions. `PropertyForm.test.tsx`: unsaved-changes guard |
| **Tenant 360** | `ResidencyDetailPage.test.tsx`: tabs, URL tab state, property name, identity from approved application, **no rooms/beds fetch until check-in opens**, 409 BED_ALREADY_OCCUPIED on the field, check-out confirmation, factual activity |
| **Search** | `CommandPalette.test.tsx`: Ctrl+K, keyboard nav, server complaint search + client sources, empty, Escape, role-filtered actions |
| **Notifications** | `NotificationBell.test.tsx`: lazy list fetch, `unreadOnly` omitted for "all", deep link + optimistic read, rollback on failure, history filter. `resolveNotificationLink.test.ts`: every screen + malicious ids |
| **Lists / URL state** | `listUrlState.test.tsx`: overdue definition, Back restores filters, filtered-empty, applications/tenants filters, debounced search. `PaymentsListPage.test.tsx`: bounded fan-out window |
| **Shared UI** | `DataTable.test.tsx`, `ErrorBoundary.test.tsx`, `statusConfig.test.ts` |

### MSW conventions (Phase 3)

- `src/test/msw.ts` has envelope-exact `ok` / `fail` builders, `failures.{unauthorized, forbidden,
  notFound, conflict, rateLimited, server, network}` and `pendingForever` for loading states.
- The default complaints handler honours `status` / `priority` / `search` / pagination like
  pg-backend, so count queries (`limit: 1`, read `.total`) behave realistically.
- Use `renderApp(route)` (`src/test/renderApp.tsx`) for anything involving routing, guards or the
  shell. It mounts the real route table with production query defaults (`createQueryClient`).
  `renderWithProviders` mounts a single page.
- Pin the clock (`vi.useFakeTimers({ toFake: ['Date'] })`) in any test whose fixtures depend on
  "this month" / "past due".
- RTL's async timeout is 4s (`src/test/setup.ts`): page tests fan out many requests, and under a
  parallel full-suite run the 1s default caused load-dependent flakes.
