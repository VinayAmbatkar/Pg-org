# Complaints

Verified directly against `pg-backend`'s `src/modules/complaints` controller/DTOs/Prisma schema.

## Status lifecycle — exactly what's implemented, nothing assumed

```text
OPEN ──assign──> ASSIGNED ──start──> IN_PROGRESS ──resolve──> RESOLVED ──close──> CLOSED
  │                  │
  └──cancel──> CANCELLED    └──unassign──> OPEN (reassign also OPEN/ASSIGNED → ASSIGNED)
```

- `ComplaintActivityType.REOPENED` exists in the Prisma enum but **no `/reopen` endpoint exists
  anywhere in the backend** — confirmed dead/unreachable. The UI never offers a reopen action.
- There is no `IN_PROGRESS → CANCELLED` and no `RESOLVED → IN_PROGRESS`. Only the transitions drawn
  above are implemented, each as its own dedicated endpoint (never a generic status dropdown) —
  `ComplaintDetailPage` shows only the action buttons the backend actually supports for the
  complaint's current status.

## Role rules (enforced backend-side; the UI mirrors them so buttons aren't shown for actions that
would 403)

- **Assign / Unassign / Close / Change priority** — OWNER/MANAGER only.
- **Start work / Resolve** — OWNER/MANAGER (any complaint), or STAFF **only if self-assigned**
  (`assignedToUserId === caller`). STAFF can never close, even a complaint assigned to them.
- **Cancel** — the reporting tenant, or OWNER/MANAGER. Only from `OPEN`.
- **Internal vs. public comments** — writing an `INTERNAL` comment requires any active org
  membership (any role) or SUPER_ADMIN. The reporting tenant only ever sees `PUBLIC` comments;
  every org member (any role) sees all comments, including internal ones.

## Endpoints consumed

| Method | Path                                   | Notes                                               |
| ------ | ---------------------------------------- | ----------------------------------------------------|
| GET    | `/complaints`                            | Paginated, filters: status/priority/category/assignedToUserId/propertyId/roomId/createdFrom/createdTo/search/sortBy/sortDir |
| GET    | `/complaints/:id`                        | Detail                                               |
| GET    | `/complaints/:id/activity`               | Timeline (status/priority/assignment changes)        |
| GET/POST | `/complaints/:id/comments`             | `{body, visibility?}` — PUBLIC default               |
| GET/POST/DELETE | `/complaints/:id/attachments[/:id]` | Reference registration only — not a file upload endpoint |
| POST   | `/complaints/:id/assign`                 | `{assignedToUserId}`                                 |
| POST   | `/complaints/:id/unassign`               |                                                       |
| POST   | `/complaints/:id/start`                  |                                                       |
| POST   | `/complaints/:id/resolve`                | `{resolutionNote}`                                   |
| POST   | `/complaints/:id/close`                  |                                                       |
| POST   | `/complaints/:id/cancel`                 |                                                       |
| POST   | `/complaints/:id/priority`               | `{priority}`                                         |

## Known limitation: assignment requires a raw user ID

The backend has no organization-member list/search endpoint (see `docs/backend-gaps.md` #3, a
Phase 1 gap that also blocks this). `Assign`/`Reassign` on the Complaint Detail page is a manual
UUID entry field, mirroring the same workaround already used for residency creation — not a
picker of real staff names. This should be replaced with a proper member picker once the backend
exposes org membership.

## Attachments are reference registration, not upload

`POST /complaints/:id/attachments` takes `{url, fileName, mimeType, size}` for an **already
hosted** image — pg-backend has no file upload endpoint in this module. The "Add" control on the
Attachments tab accepts a URL, not a file picker.

## Routes

```text
/app/complaints                Complaint list (search, status/priority/category filters, paginated)
/app/complaints/:complaintId   Operational workspace: details, actions, activity, comments, attachments
```
