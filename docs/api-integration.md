# API Integration

## Two things every route path in this doc omits

1. **Every backend route sits behind a global prefix, `/api/v1`** (`main.ts:48`,
   `app.setGlobalPrefix('api/v1')`). This wasn't visible from reading controllers/DTOs alone —
   it was only caught by an end-to-end smoke test against the running backend. `src/app/config/
   env.ts` appends it once (`env.apiUrl = \`${apiOrigin}/api/v1\``), so every path elsewhere in
   this doc and in `api/*.ts` files is written relative to that (e.g. `/auth/register` really
   means `POST http://<host>/api/v1/auth/register`).
2. **Every response is wrapped** in `{success: true, data: <the DTO>, requestId}` on success, or
   `{success: false, error: {code, message, details?}, requestId}` on failure (a global
   `ResponseInterceptor`/`AllExceptionsFilter` in the backend — see
   `src/infrastructure/api/envelope.ts`). This is also unwrapped in exactly one place:
   `apiClient`'s response interceptor rewrites `response.data` to the inner `data` before any
   feature code sees it, and `normalizeError` reads `error.response.data.error` for the code/
   message. No feature `api/*.ts` file ever sees the envelope directly — they read `response.data`
   as if it were the bare DTO, matching what the verified DTOs in `docs/backend-gaps.md`'s research
   describe.

If you're debugging a request in the Network tab and the shape looks different from what a hook
expects, remember: DevTools shows the *wire* response (enveloped), while every application-level
type in `src/types/api.ts` describes the *unwrapped* shape.

## Client

`src/infrastructure/api/client.ts` exports a single configured axios instance (`apiClient`) used
by every feature's `api/*.ts` module. Components never call `axios` directly.

- Base URL from `VITE_API_URL` (`.env.example`; defaults to `http://localhost:3000`).
- Request interceptor injects `Authorization: Bearer <token>` (skipped for the auth endpoints).
- Response interceptor handles 401 → single-flight refresh → retry, per `docs/authentication.md`.
- All errors are normalized through `src/infrastructure/api/errors.ts` into an `ApiError` with a
  `kind` (`validation | unauthorized | forbidden | not_found | conflict | rate_limited | server |
  network | unknown`) and a friendly, UI-safe `message` — raw Nest/Prisma error bodies are never
  shown to the user. Backend validation messages (400s) are the one case where the backend's own
  message is surfaced directly, since those are already written for end users.

## Error handling by status

| Status | `kind`         | Frontend behavior                                                        |
| ------ | -------------- | -------------------------------------------------------------------------- |
| 400    | `validation`   | Backend message shown inline/in a toast                                    |
| 401    | `unauthorized` | Triggers refresh; if refresh fails, session cleared + redirect to `/login` |
| 403    | `forbidden`    | "You don't have permission to do that."; `INSUFFICIENT_ROLE` gets role-specific copy |
| 404    | `not_found`    | "We could not find what you were looking for."                             |
| 409    | `conflict`     | Code-specific, actionable copy from `ERROR_CODE_MESSAGES` (e.g. `BED_ALREADY_OCCUPIED` → "pick a different bed", `VISIT_TIME_CONFLICT` → "choose a different slot", `DUPLICATE_BILLING_PERIOD`, `INVALID_*_STATE` → "refresh to see the latest"). Unmapped domain 409s show pg-backend's hand-written message |
| 429    | `rate_limited` | "Too many requests…"; never auto-retried                                     |
| 5xx    | `server`       | Generic apology (backend text is never shown), retried up to twice          |
| —      | `network`      | "Unable to reach the server…". A timeout gets "took too long" copy but stays `kind: 'network'`, so the auth layer never wipes a valid session over a slow response |

400 responses also expose per-field messages (`ApiError.fieldErrors`) parsed from the backend's
`details: [{field, constraints}]`.

### Backend behaviours the client must respect (verified in pg-backend)

- **Throttle:** a global 100 requests / 60 s per client (auth routes: 10 / 60 s). Client-side
  fan-outs (beds per room, payments per invoice) are the main pressure. Payments is bounded to a
  billing-period window and Tenant 360 loads rooms/beds only when check-in opens. See
  `docs/performance.md`.
- **Unknown query params → 400** (`forbidNonWhitelisted`). Only send documented params.
- **`GET /me/notifications?unreadOnly=false` returns unread only**, because `@Type(() => Boolean)`
  turns the string "false" into true. `notificationsApi.list` omits the param for "all".

## Nested resource paths

Rooms and Beds mirror the backend's own nesting exactly — there is no flat `/rooms` or `/beds`
endpoint:

```
/properties/:propertyId/rooms
/properties/:propertyId/rooms/:roomId/beds
```

Residencies are nested for creation/list (`/properties/:propertyId/residencies`) but flat for
everything else (`/residencies/:id`, `/residencies/:id/check-in`, `/check-out`) — the frontend's
routes follow this split (see `src/app/router/routes.tsx`: Residency Detail is `/app/residencies/
:residencyId`, not nested under a property).

## Query key factories

Every feature exposes `api/queryKeys.ts` (e.g. `propertyKeys`, `roomKeys`, `bedKeys`,
`tenantKeys`, `residencyKeys`, `notificationKeys`, `organizationKeys`) so keys are constructed in
exactly one place and mutations can invalidate precisely.

## Rooms & beds (backend Phase 13 contract)

| Endpoint | Used by | Notes |
| --- | --- | --- |
| `GET /properties/:propertyId/rooms` | Rooms & Beds, dashboard, Property 360 | Each room includes `pricePerBed`, `amenities`, `imageUrl`, `description` and exact `occupancy` |
| `GET /properties/:propertyId/rooms/:roomId/beds` | Room detail, grid bed chips, check-in dialog | Each bed includes `berth` and current `occupant` |
| `GET /properties/:propertyId/rooms/:roomId/history` | Room detail → History | Allocation history, newest first, max 100 |
| `PATCH /properties/:propertyId/rooms/:roomId` | Edit room, Change photo | `null` clears `pricePerBed` / `imageUrl` / `description` |

Check-in/out and bed create/update/archive invalidate the rooms and beds caches, because they
change occupancy.
