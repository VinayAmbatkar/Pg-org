# Authorization

## Role discovery

The backend's JWT carries no role or org claims, and `/auth/me` returns only `platformRole`
(`SUPER_ADMIN | USER` — a platform-level flag, unrelated to org roles). The **only** way to learn
a user's role within an organization is `GET /organizations`, whose response includes `yourRole`
(`OWNER | MANAGER | STAFF | STUDENT`) per organization. `AuthProvider` fetches this list right
after login/register/session-restore and keeps it in TanStack Query's cache.

Because there's no backend membership/invite endpoint yet (see `docs/backend-gaps.md` §3),
`yourRole` is `OWNER` for every organization in practice today — anyone who self-creates an org
is atomically granted `OWNER` of it, and there is no path to becoming `MANAGER`/`STAFF` of an
existing org.

## Permission model

`src/infrastructure/permissions/permissions.ts` centralizes every role check as a lookup table —
no `if (role === 'OWNER')` scattered through components. It mirrors the role matrices confirmed in
pg-backend's service code. The full permission → role table, and where each one is enforced
(route guard, sidebar, palette, sections, action buttons), is in **`docs/permissions.md`**.

In short: `*.view` = OWNER/MANAGER/STAFF, `*.manage` = OWNER/MANAGER, `*.archive` and
`organizations.manage` = OWNER only, and `complaints.work` lets STAFF start/resolve complaints
assigned to them.

### Route-level guards (Phase 3)

Until Phase 3 only the sidebar hid modules; a direct URL still rendered the page (and let the
backend 403 every request). Every module route group is now wrapped in `RequirePermission` with
the same permission as its sidebar entry, so a bookmark or refresh shows a clear "You don't have
access to this page" state inside the app shell instead.

## Important caveat

**The frontend permission check is a UX convenience, not a security boundary.** Every mutation is
still enforced server-side (the backend returns 403 for an insufficient role, 404 for a resource
outside the caller's organization). Hiding a button never substitutes for the backend's own
authorization — see `docs/architecture.md` and the security section of the final report for how
this was verified.
