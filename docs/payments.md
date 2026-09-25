# Payments

Verified directly against `pg-backend`'s `src/modules/payments` controller/DTOs/Prisma schema.

## Concepts

A tenant's payment against an invoice splits into three figures, all backend-computed and always
shown as three separate numbers — never combined or implied:

- **Gross amount** (`Payment.amount`) — what the tenant paid.
- **Platform fee** (`Payment.platformFee`) — PGMet's cut. Never client-suppliable; computed
  server-side from the active `PlatformFeeRule` at order-creation time (`FIXED` fee type only
  today — `PERCENTAGE` is reserved but unimplemented).
- **Owner settlement** (`Payment.ownerSettlementAmount`) — gross minus platform fee, i.e. what the
  owner actually receives. **The entire gross amount is never presented as PGMet revenue** — the
  UI always shows the owner their settlement figure.

## Endpoints consumed

| Method | Path                              | Notes                                                    |
| ------ | ---------------------------------- | --------------------------------------------------------- |
| GET    | `/invoices/:invoiceId/payments`   | All payments for one invoice, unpaginated                 |
| GET    | `/payments/:id`                   | Payment detail, includes nested `settlement` when present |
| POST   | `/payments/:id/refund`            | `{amount?, reason?}` — OWNER/MANAGER only, CAPTURED/PARTIALLY_REFUNDED only |

Razorpay checkout/verification (`POST /invoices/:invoiceId/payments/order`,
`POST /payments/:id/verify`) is a tenant-app concern, not Owner/Manager Web — this app only ever
*views* payments and *refunds* them.

## Status handling

`PaymentStatusBadge` renders the exact backend enum:
`CREATED | PENDING | AUTHORIZED | CAPTURED | FAILED | CANCELLED | REFUNDED | PARTIALLY_REFUNDED`.
No Razorpay-specific implementation detail (order IDs, signatures, gateway status strings) is ever
shown to the owner — only the status badge and, on failure, `failureMessage`.

## Payments list — a composed view

The backend has no "list all payments for a property/org" endpoint (see
`docs/backend-gaps.md`) — only "payments for one invoice". `PaymentsListPage` composes the
property-wide view via `usePaymentsForProperty`, which fans out one
`GET /invoices/:invoiceId/payments` call per invoice already fetched for the current property.
This is an N+1 pattern, acceptable at typical PG invoice volume but not infinitely scalable — see
the backend-gaps entry for the recommended server-side fix.

## Routes

```text
/app/payments                 Payments list (composed across every invoice for the current property)
/app/payments/:paymentId      Payment detail (amount breakdown, settlement, refund)
```
