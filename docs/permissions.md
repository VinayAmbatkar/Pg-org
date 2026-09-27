# Permissions reference

The single table behind every role check: `src/infrastructure/permissions/permissions.ts`.
Components, the sidebar, the command palette and route guards all call `hasPermission(role, p)`;
nothing compares role strings directly. For the model and its limits see `authorization.md`.

## Matrix

`VIEW` = OWNER, MANAGER, STAFF · `MANAGE` = OWNER, MANAGER · `ALWAYS` also includes STUDENT.

| Permission | Roles | Used for |
| --- | --- | --- |
| `dashboard.view` | ALWAYS | `/app/dashboard` (sections inside are gated by their own module permission) |
| `organizations.view` / `.manage` | ALWAYS / OWNER | `/app/settings` / editing the organization |
| `properties.view` / `.manage` / `.archive` | VIEW / MANAGE / OWNER | Properties list + Property 360 / create, edit / archive |
| `rooms.view` / `.manage` / `.archive` | VIEW / MANAGE / OWNER | `/app/rooms`, room detail / add, edit rooms / archive rooms |
| `beds.view` / `.manage` / `.archive` | VIEW / MANAGE / OWNER | bed cards / add, edit beds / archive beds |
| `tenants.view` | VIEW | `/app/tenants`, Tenant 360 |
| `residency.view` / `.manage` | VIEW / MANAGE | Tenant 360 overview & activity / add tenant, check-in, check-out, end date |
| `billing.view` / `.manage` | VIEW / MANAGE | invoices, rent plans, Rent/Invoices tabs / generate, issue, void |
| `payments.view` / `.refund` | VIEW / MANAGE | payments list & detail / refunds |
| `complaints.view` / `.manage` | VIEW / MANAGE | complaints list & detail / assign, priority, close |
| `complaints.work` | VIEW | start / resolve a complaint **assigned to you** (pg-backend lets STAFF do this) |
| `food.view` / `.manage` | VIEW / MANAGE | food module / configuration, plans, menus |
| `applications.view` / `.manage` | VIEW / MANAGE | applications / review, approve, reject, onboarding |
| `visits.view` / `.manage` | VIEW / MANAGE | visits / schedule, confirm, complete, cancel |
| `notifications.view` | ALWAYS | notification bell and `/app/notifications` |

## Where each permission is enforced in the UI

| Layer | Mechanism | File |
| --- | --- | --- |
| Route | `guarded(permission, routes)` wraps each module's routes in `RequirePermission`; a direct URL, bookmark or refresh without the permission renders an in-shell "no access" page | `src/app/router/routes.tsx`, `src/app/guards/RequirePermission.tsx` |
| Navigation | each `NAV_ITEMS` entry carries the **same** permission as its route group | `src/components/navigation/Sidebar.tsx` |
| Command palette | pages/actions filtered with the same permissions; search sources gated by `*.view` | `src/features/search/` |
| Sections / tabs | Dashboard sections, Property 360 and Tenant 360 tabs render only when permitted, so no request fires for a forbidden domain | `DashboardPage.tsx`, `PropertyDetailPage.tsx`, `ResidencyDetailPage.tsx` |
| Actions | buttons for `*.manage` / `*.archive` / `complaints.work` | feature pages |

`src/app/router/routes.test.tsx` asserts every sidebar target resolves to a real route, and that a
role without `rooms.view` gets neither the sidebar entry nor the page.


## Property listing (public Tenant Web listing)

| Permission | Roles | Enforced by |
| --- | --- | --- |
| `listing.view` | OWNER, MANAGER, STAFF | `PropertyListingsService` READ_ROLES (`GET /properties/:id/listing` - note it lazily creates an empty DRAFT) |
| `listing.manage` | OWNER, MANAGER | `PropertyListingsService` MANAGE_ROLES (`PATCH /properties/:id/listing`, `POST …/publish`, `POST …/unpublish`) |

UI: Property detail → **Listing** tab (`features/listings`). Publishing requires title, description,
city (copied from the property address) and locality - the backend returns `LISTING_INCOMPLETE`
otherwise. Numbers (price, latitude, longitude) can't be cleared once set: `UpsertListingDto`
keeps the existing value when omitted and rejects `null`, so the form blocks emptying them.
