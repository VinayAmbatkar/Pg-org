# Applications

Verified directly against `pg-backend`'s `src/modules/tenant-discovery` controller/DTOs/Prisma
schema (the applications half — see `docs/visits.md` for the visits half of the same module).

## The acquisition boundary — approval is not onboarding

```text
SUBMITTED → UNDER_REVIEW → (optional VISIT_SCHEDULED) → APPROVED/REJECTED/WITHDRAWN/EXPIRED
```

**`POST /applications/:id/approve` creates nothing.** It only flips the status. Read directly from
`application-conversion.service.ts`: the actual tenant/residency/bed/invoice chain is a separate,
explicit sequence of calls:

1. `POST /applications/:id/approve` — records the decision only.
2. `POST /applications/:id/start-onboarding` — creates (or reuses, race-safe) exactly **one**
   thing: a `Tenant` row. If the application was a guest submission, it first creates the `User`
   account too. Returns `{tenantId, applicationId, reused}`.
3. **Separately, manually** — `POST /residencies` (existing Phase 1 endpoint) using that
   `tenantId`, then check-in, then rent plan, then invoice generation.

`ApplicationDetailPage` mirrors this exactly: approving surfaces a "Start onboarding" button (not
an auto-redirect), and its result links to `/app/properties/:propertyId/residencies/new` for the
tenant to manually continue the existing residency-creation flow — it does **not** auto-create a
residency, bed allocation, or invoice, per the phase brief's explicit instruction not to.

`internalReviewNotes` on `Application` is never exposed to any caller, including owner/manager —
there is nothing to show for it in the UI.

## Endpoints consumed

| Method | Path                                     | Notes                                          |
| ------ | ------------------------------------------ | ------------------------------------------------|
| GET    | `/properties/:propertyId/applications`    | No pagination                                   |
| GET    | `/applications/:id`                        | Detail                                          |
| POST   | `/applications/:id/review`                 | SUBMITTED → UNDER_REVIEW                        |
| POST   | `/applications/:id/approve`                | (UNDER_REVIEW\|VISIT_SCHEDULED) → APPROVED — decision only |
| POST   | `/applications/:id/reject`                 | `{reason?}` — same source statuses → REJECTED   |
| POST   | `/applications/:id/start-onboarding`       | APPROVED only → `{tenantId, applicationId, reused}` |

Visit scheduling for an application (`POST /applications/:applicationId/visits`) is documented in
`docs/visits.md`.

## Routes

```text
/app/applications                 List
/app/applications/:applicationId  Detail: applicant info, visits, review/approve/reject, onboarding
```
