# Food

Verified directly against `pg-backend`'s `src/modules/food` controller/DTOs/Prisma schema.

## Entitlement model

A tenant's actual meal entitlement is `includedMeals` (from `mealsIncludedInRent` +
`includedMealTypes`, when the config is `enabled`) plus `subscriptionMeals` (their active
subscription's `mealTypesSnapshot`, when `optionalSubscriptionEnabled`, with any overlap against
`includedMeals` excluded server-side). Owner Web configures the inputs to this
(`FoodConfigurationPage`, `FoodPlansPage`, `FoodSubscriptionsPage`) — the combination logic itself
lives entirely server-side (`FoodEntitlementService`) and is not duplicated in the frontend.

## Menu lifecycle — published menus stay editable

`DRAFT → PUBLISHED → CANCELLED` (terminal). Unlike most status lifecycles in this app,
**`PUBLISHED` menus can still be edited** — only `CANCELLED` blocks further edits. This is
intentional backend behavior (a `FOOD_MENU_UPDATED` notification fires to tenants on such an
edit), so `DailyMenuPage` never treats `PUBLISHED` as read-only, and mutations always invalidate
the menu queries (`useMenus`/`useMenu`) so an edit is immediately reflected rather than served from
a stale cache — see item 30 of the phase brief ("Live Menu Updates").

## Endpoints consumed

| Method | Path                                              | Notes                                       |
| ------ | --------------------------------------------------- | ---------------------------------------------|
| GET/PATCH | `/properties/:propertyId/food`                  | Configuration — lazily provisioned, disabled by default |
| GET/POST | `/properties/:propertyId/food/menus`             | List (no pagination) / create for a date     |
| PUT    | `/properties/:propertyId/food/menus/week`          | Atomic 7-day upsert, full item replace, never auto-publishes |
| GET/PATCH | `/food/menus/:id`                               | Detail / full item replace                   |
| POST   | `/food/menus/:id/publish`                          | DRAFT → PUBLISHED only                       |
| POST   | `/food/menus/:id/cancel`                           | Terminal                                     |
| POST   | `/food/menus/:menuId/items`, PATCH/DELETE `/food/menu-items/:id` | Per-item CRUD (used instead of the full-replace PATCH for single add/remove) |
| GET/POST/PATCH | `/properties/:propertyId/food/plans`, `/food/plans/:id` | Plans — price/currency/billingCycle immutable after creation |
| POST   | `/food/plans/:id/archive`                          | Irreversible                                 |
| GET    | `/properties/:propertyId/food/subscriptions`       | No pagination                                |
| GET/POST | `/properties/:propertyId/food/meal-consumptions` | Paginated (unlike most other food list endpoints) |

## Weekly Menu is read-only in Owner Web

`GET /properties/:propertyId/food/menus/week`'s query contract wasn't in the verified backend
survey (only the `PUT` body shape was confirmed: `WeeklyMenuDto{days: [{date, items[]}]}`).
Rather than guess an unverified query parameter, `WeeklyMenuPage` composes its 7-day view from the
already-documented `GET /properties/:propertyId/food/menus?from=&to=`, and is read-only —
day-by-day editing happens on `DailyMenuPage`, which links from each day. Wiring the `PUT` bulk-save
endpoint into an inline weekly editor is a reasonable follow-up once the `GET .../week` query
contract is confirmed.

## Meal consumption is staff-only today

`POST /properties/:propertyId/food/meal-consumptions` always records `source: 'STAFF_MARKED'`
server-side — `MealConsumptionSource.TENANT_MARKED`/`SYSTEM` exist in the Prisma enum but have no
producing code path. `MealConsumptionPage` is therefore an Owner/Manager/Staff attendance-marking
tool, not a tenant self-check-in flow (there is no tenant-facing endpoint to build that against).

## Routes

```text
/app/food                    Overview (links to every section below)
/app/food/configuration      Meals included in rent, optional subscriptions
/app/food/plans              Optional meal plans (create/archive)
/app/food/menu                Daily menu (create/edit items/publish/cancel)
/app/food/menu/week           Weekly overview (read-only)
/app/food/subscriptions       Tenant meal subscriptions
/app/food/consumption         Mark today's meal attendance
```
