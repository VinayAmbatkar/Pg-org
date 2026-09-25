# End-to-end tests (Playwright)

```bash
npm run test:e2e            # builds the app, serves it with `vite preview`, runs e2e/ in Chromium
npx playwright test --ui    # interactive runner
npx playwright show-trace test-results/<test>/trace.zip   # debug a failure
```

First-time setup on a new machine: `npx playwright install chromium`.

## What it runs against

- **The production build.** `playwright.config.ts` runs `vite build` (into `dist-e2e/`, so `dist/` is
  never overwritten) and `vite preview` on port 4173,
  so every E2E run is also a smoke test of the real bundle: code splitting, lazy chunks, env baking.
- **A deterministic mock backend, never a real one.** The app is built with
  `VITE_API_URL=http://api.pgmet.e2e`, an origin that doesn't resolve. Every `/api/v1/**` request is
  answered by `e2e/support/mockBackend.ts` through Playwright routing. State is in-memory and fresh
  per test (each test gets its own browser context).
- The mock mirrors pg-backend where it matters: the `{success, data, requestId}` envelope, Bearer
  auth on every non-auth route, **single-use rotating refresh tokens with reuse detection**
  (a reused token revokes all sessions, like `AuthService.refresh`), and the lifecycle transitions
  the flows use (review → visit → approve, complaint start work).

The shared fixture (`e2e/support/fixtures.ts`) runs for every test and fails it afterwards if:

1. the app called an endpoint the mock doesn't implement (i.e. drifted from the verified contract), or
2. the session ever tripped refresh-token reuse detection.

## The suite (`e2e/critical-flows.spec.ts`)

| # | Flow |
| --- | --- |
| 1 | Login → dashboard → **reload** → still authenticated (exactly one refresh per load) |
| 2 | **Rooms & Beds (P0):** sidebar → `/app/rooms` renders → reload → still accessible; `aria-current`, tab title |
| 3 | Dashboard → Properties → Property 360 (health shows 50%) → Rooms & Beds tab |
| 4 | Tenants → Tenant 360 → residency overview |
| 5 | Dashboard overdue alert → invoices filtered to `?status=OVERDUE` → invoice detail |
| 6 | Complaints → complaint detail → Start work (state moves to IN_PROGRESS) |
| 7 | Applications → detail → Start review → Schedule visit → Approve |
| 8 | Ctrl+K palette → "rooms" → Enter → Rooms & Beds |
| 9 | `@responsive`: at 1440/1280/1024/768, key pages never scroll horizontally and the shell stays usable |

## Adding a flow

1. Add the fixture data and handlers the flow needs to `mockBackend.ts`. Copy the real response
   shape from the pg-backend DTO, not from the frontend types.
2. Drive the UI by role and accessible name (`getByRole('button', { name: … })`). If a control can't
   be found that way, that's usually an accessibility bug to fix, not a reason to add a test id.
3. Keep assertions on user-visible outcomes. Use `backend.state` only to confirm a mutation reached
   the server.
