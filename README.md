# PGMet Owner/Manager Web

The PGMet Owner/Manager Web application — React + Vite + TypeScript, consuming the pg-backend
NestJS API. Phase 1 (auth, properties, rooms, beds, tenants, residency, dashboard basics),
Phase 2 (session reliability, billing, payments, complaints, food, applications, visits, Tenant/
Property 360) and Phase 3 (intelligence & hardening: Rooms & Beds routing fix, operational
dashboard and alerts, Property/Tenant 360, command palette, notification center, cross-tab session
safety, accessibility, E2E) are complete. See `docs/production-readiness.md`.

## Setup

```bash
npm install
cp .env.example .env   # set VITE_API_URL to your running pg-backend instance
npm run dev
```

## Scripts

```bash
npm run dev         # start the dev server
npm run build        # typecheck + production build
npm run typecheck    # tsc project references only
npm run lint          # oxlint
npm test              # vitest (single run)
npm run test:watch    # vitest (watch mode)
npm run test:e2e      # playwright, against the production build + mock backend (docs/e2e.md)
npm run preview       # preview a production build
```

## Documentation

See `docs/`:

- `architecture.md` — folder structure and why
- `authentication.md` — token handling and session restoration (includes the Phase 2 StrictMode
  fix for the "refresh logs you out" bug)
- `session-management.md` — short operational reference for session lifetime/end triggers
- `authorization.md` — the role/permission model; `permissions.md` — the full permission matrix
  and where each permission is enforced
- `state-management.md` — TanStack Query vs. Zustand vs. URL state
- `api-integration.md` — the API client, error handling, nested routes
- `design-system.md` — UI primitives and visual conventions
- `testing.md` — Vitest/RTL/MSW setup and coverage; `e2e.md` — Playwright suite
- `performance.md`, `security.md`, `accessibility.md` — Phase 3 audits, findings and conventions
- `deployment.md` — build, hosting, required security headers, release checklist
- `production-readiness.md` — per-area READY / LIMITATION / BACKEND BLOCKED assessment
- `backend-gaps.md` — real limitations in the current backend and how the app works around them
- `billing.md`, `payments.md`, `complaints.md`, `food.md`, `applications.md`, `visits.md` —
  Phase 2 business modules: verified endpoints, status lifecycles, and known limitations
