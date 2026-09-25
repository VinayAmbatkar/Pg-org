# Visits

Verified directly against `pg-backend`'s `src/modules/tenant-discovery` controller/DTOs/Prisma
schema (the visits half — see `docs/applications.md` for the applications half of the same module).

## Conflict detection

Exact rule, read from `visits.service.ts`: two visits conflict when they're at the **same
property**, the other visit's status is **`SCHEDULED`** (not `REQUESTED`/`COMPLETED`/`CANCELLED`/
`NO_SHOW` — only `SCHEDULED` blocks), and their time ranges overlap
(`start < other.end AND end > other.start`), excluding the visit being rescheduled against itself.
The whole check runs inside a transaction guarded by a Postgres advisory lock keyed on the property
ID, closing the race window between two owners double-booking the same slot.

The frontend never tries to pre-empt this client-side — `ScheduleVisitDialog` and the reschedule
dialog on `VisitsListPage` submit the chosen time and surface the backend's `VISIT_TIME_CONFLICT`
response as a clear inline error ("This time overlaps with another scheduled visit at this
property") rather than guessing at availability.

## Status lifecycle

```text
REQUESTED ──confirm──> SCHEDULED ──complete──> COMPLETED
    │                      │
    └──cancel──> CANCELLED └──reschedule──> SCHEDULED (new time)
                           └──no-show──> NO_SHOW
                           └──cancel──> CANCELLED
```

Only these transitions exist. `VisitsListPage` shows only the action buttons valid for a visit's
current status.

## Endpoints consumed

| Method | Path                                          | Notes                                    |
| ------ | ----------------------------------------------- | -------------------------------------------|
| GET    | `/properties/:propertyId/visits`               | No pagination                             |
| GET    | `/visits/:id`                                   | Detail                                    |
| POST   | `/applications/:applicationId/visits`          | Owner-initiated — straight to SCHEDULED, conflict-checked |
| POST   | `/visits/:id/confirm`                           | REQUESTED → SCHEDULED, conflict-checked   |
| POST   | `/visits/:id/reschedule`                        | `{scheduledStartAt, scheduledEndAt}` — SCHEDULED → SCHEDULED, conflict-checked |
| POST   | `/visits/:id/complete`                          | SCHEDULED → COMPLETED                     |
| POST   | `/visits/:id/no-show`                           | SCHEDULED → NO_SHOW                       |
| POST   | `/visits/:id/cancel`                            | (REQUESTED\|SCHEDULED) → CANCELLED — applicant or OWNER/MANAGER |

## Routes

```text
/app/visits    List with inline Confirm/Reschedule/Complete/No-show/Cancel actions
```

Scheduling a new visit happens from the Application Detail page
(`/app/applications/:applicationId`), since it's an application-scoped action
(`POST /applications/:applicationId/visits`).
