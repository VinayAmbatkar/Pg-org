# Billing (rent plans & invoices)

Verified directly against `pg-backend`'s `src/modules/rent-plans` and `src/modules/invoices`
controllers/DTOs/Prisma schema.

## Concepts

- **Rent plan** — the recurring monthly rent agreed for a residency (amount, due day). A residency
  has at most one `ACTIVE` rent plan at a time; creating a new one closes the previous one
  (`effectiveTo` set, `status: INACTIVE`).
- **Invoice** — a single billing period's bill, generated from the residency's active rent plan for
  a specific calendar month. Financial fields (`subtotal`/`discount`/`tax`/`total`/`items`) are
  immutable once created.
- **Payment** — a tenant's payment against an invoice (see `docs/payments.md`). Rent plan, invoice,
  and payment are three separate concepts and are never conflated in the UI.

## Endpoints consumed

| Method | Path                                    | Notes                                              |
| ------ | ---------------------------------------- | --------------------------------------------------- |
| GET    | `/residencies/:residencyId/rent-plan`    | Current `ACTIVE` plan only — 404 if none            |
| POST   | `/residencies/:residencyId/rent-plan`    | Creates a new plan, closes the previous one          |
| PATCH  | `/rent-plans/:id`                        | `{dueDay}` or `{deactivate: true}` — amount/currency/effectiveFrom are immutable |
| GET    | `/properties/:propertyId/invoices`       | All invoices for the property, unpaginated (see `docs/backend-gaps.md` #9) |
| GET    | `/invoices/:id`                          | Invoice detail, with `items[]`                      |
| POST   | `/residencies/:residencyId/invoices`     | `{year, month}` — generates from the residency's active rent plan |
| PATCH  | `/invoices/:id`                          | `{dueDate}` — DRAFT only                             |
| POST   | `/invoices/:id/issue`                    | DRAFT → ISSUED                                       |
| POST   | `/invoices/:id/void`                     | Terminal — any non-VOID status → VOID                |

## Status handling

`InvoiceStatusBadge` and `RentPlanStatusBadge` (`src/features/billing/components`) render exactly
the backend enum values — `DRAFT | ISSUED | OVERDUE | PARTIALLY_PAID | PAID | VOID` and
`ACTIVE | INACTIVE` respectively. `OVERDUE` is computed lazily by the backend on read (never by the
frontend) and only ever applies while an invoice has had zero captured payments — see
`src/features/billing/lib/invoiceBalance.ts` for why this invariant matters to the paid/outstanding
calculation.

## Paid / Outstanding

The backend does not expose a paid/outstanding field on `InvoiceResponseDto` (see
`docs/backend-gaps.md` #7). `computeInvoiceBalance()` derives it:

- `PAID` → paid = total, outstanding = 0 (exact)
- `VOID` → paid = 0, outstanding = 0 (exact)
- `DRAFT`/`ISSUED`/`OVERDUE` → paid = 0, outstanding = total (exact — no capture has landed yet)
- `PARTIALLY_PAID` → paid = sum of this invoice's `CAPTURED` payments (best-effort; flagged
  `isApproximate: true` and shown with a disclosure note, since a later partial refund on one of
  those payments isn't reflected anywhere in the payment response)

## Rent Plans page

Since the backend has no property-wide rent-plan list endpoint (`docs/backend-gaps.md` #8),
`RentPlansPage` fetches the property's residencies and fans out one
`GET /residencies/:id/rent-plan` call per active/notice-period residency via
`useRentPlansForProperty`. Only the *current* plan per residency is shown — prior (now `INACTIVE`)
plans are not retrievable at all.

## Billing overview

`BillingOverviewPage` aggregates Total Outstanding / Overdue / Due Soon / Paid by summing real
`invoice.total` values from the already-fetched invoice list, grouped by `status` (and `dueDate`
for "due soon", a 7-day window) — never a fabricated number. `PARTIALLY_PAID` invoices count at
their full `total` here (not the approximate paid/outstanding split) to keep this a single request;
the Invoice Detail page is where the more precise, payments-derived split is shown.

## Routes

```text
/app/billing                        Overview (outstanding/overdue/due-soon/paid summary cards)
/app/billing/invoices                Invoice list (search, status filter, URL-synced)
/app/billing/invoices/:invoiceId     Invoice detail (amount breakdown, paid/outstanding, payments, issue/void)
/app/billing/rent-plans              Rent plans (set/edit/deactivate per residency)
```

"Generate invoice" lives on the Residency Detail page (`/app/residencies/:residencyId`), since
invoice generation is a residency-scoped action (`POST /residencies/:residencyId/invoices`).
