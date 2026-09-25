# Production readiness: Owner/Manager Web

Assessed at the end of Phase 3 (2026-09-25) against the current pg-backend. Each rating is based
on implemented, tested behaviour; limitations link to `backend-gaps.md` (BG §n).

**READY**: complete for the backend as it exists · **READY WITH LIMITATION**: shippable, with a
documented constraint users will notice · **BACKEND BLOCKED**: can't be built honestly without a
backend change · **FUTURE**: intentionally out of scope for this product.

| Area | Rating | Notes |
| --- | --- | --- |
| Authentication | READY | Login/register/logout, reload restore, 401 → refresh → retry, invalid refresh → login, StrictMode-safe bootstrap, **cross-tab refresh lock and session sync**. Unit + integration + E2E |
| Authorization | READY WITH LIMITATION | One permission table; route guards, nav, actions and sections gated. No membership/invite endpoints, so in practice every user is OWNER of their own org (BG §3) |
| Routing | READY | Shared path table; Rooms & Beds P0 fixed with regression tests (unit + E2E); route error boundaries; in-shell 404 |
| Dashboard | READY WITH LIMITATION | Real occupancy, rent collection, pipeline, complaints, visits, activity and alerts, per-section failure isolation. No trends/history (BG §12). Cost grows with room count (BG §13) |
| Properties | READY | List, create/edit (unsaved-changes guard), archive with consequence dialog, Property 360 health overview + 7 module tabs |
| Rooms & Beds | READY WITH LIMITATION | `/app/rooms` + room detail, search/status filters. Per-bed occupancy isn't readable (BG §1): vacancy is derived at property level |
| Tenants | READY WITH LIMITATION | ID-based list with status filter. Names/phones only where an approved application links them (BG §15). Adding a tenant needs a known Tenant ID (BG §2) |
| Residency | READY WITH LIMITATION | Tenant 360 (tabs in URL, lazy data, factual activity), check-in with actionable 409s, check-out confirmation. An existing stay's room/bed isn't retrievable after reload (BG §1) |
| Billing | READY WITH LIMITATION | Invoices with filters/sort/pagination, detail, issue/void, rent plans, generate. Filtering is client-side (BG §9); partially-paid balances approximated from payments (BG §7) |
| Payments | READY WITH LIMITATION | List bounded to a billing-period window, detail, refund. Composed per invoice (BG §10) |
| Complaints | READY | Server-side filters/search/sort/pagination, detail, full lifecycle actions, comments, attachments (URL-validated) |
| Food | READY WITH LIMITATION | Configuration, plans, daily menu (URL date), subscriptions, consumption. Weekly view read-only; bulk week save not wired (BG §11) |
| Applications | READY | Status-filtered list, detail, review → visit → approve/reject → onboarding (E2E covered) |
| Visits | READY WITH LIMITATION | Schedule/confirm/reschedule/complete/no-show/cancel. No status/date filter; "upcoming" from the 100 most recent (BG §18) |
| Notifications | READY WITH LIMITATION | Badge, popover, history page, mark read (optimistic + rollback), mark all, validated deep links. Poll-only (BG §6); no property filter (BG §20) |
| Search | READY WITH LIMITATION | Ctrl/Cmd+K palette: pages/actions, server complaint search, current-property rooms/invoices/applications. No global search API (BG §14) |
| Operational alerts | READY | Overdue invoices, unassigned high-priority complaints, pending check-ins, new applications, unpublished menu, vacant beds, each deep-linked to a filtered list |
| Bulk operations | BACKEND BLOCKED | No bulk endpoints except weekly menu upsert; not simulated with N requests (BG §17) |
| Tenant audit trail | BACKEND BLOCKED | Only a record-timestamp history is shown (BG §16) |
| Performance | READY WITH LIMITATION | Route splitting, Recharts lazy (-85 kB gzip from dashboard/360), no duplicate requests, bounded fan-outs. Very large properties can meet the 100 req/min throttle on a cold dashboard (BG §13) |
| Security | READY WITH LIMITATION | Review complete (`security.md`). Refresh token must live in `localStorage` (BG §21). **A CSP must be configured at deploy time** (`deployment.md`) |
| Accessibility | READY WITH LIMITATION | Keyboard/focus/semantics audit fixed (`accessibility.md`). Colour contrast of small muted text not yet tool-verified |
| Testing | READY | 172 Vitest/RTL/MSW tests, 9 Playwright E2E flows on the production build |
| Tenant Web / Tenant Mobile / Marketplace / PGMet Internal | FUTURE | Separate products |

## Before the first production deploy

1. Set `VITE_API_URL` to the https API origin, and configure the CSP + security headers and the SPA
   fallback (`deployment.md`).
2. Confirm pg-backend CORS allows the Owner Web origin.
3. Run the release checklist, then smoke-test the deployed build.
4. Run an axe/Lighthouse contrast pass against the deployed build.
