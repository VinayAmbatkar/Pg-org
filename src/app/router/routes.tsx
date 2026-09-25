import { lazy, Suspense, type ReactNode } from 'react'
import { createBrowserRouter, Navigate, type RouteObject } from 'react-router-dom'
import { NotFoundState, RouteErrorBoundary } from '@/components/feedback/ErrorBoundary'
import { PageSpinner } from '@/components/feedback/PageSpinner'
import { RequireAuth } from '../guards/RequireAuth'
import { RequireOrganization } from '../guards/RequireOrganization'
import { RequirePermission } from '../guards/RequirePermission'
import type { Permission } from '@/infrastructure/permissions/permissions'
import { AppShellLayout } from '../layouts/AppShellLayout'
import { LandingPage } from '../LandingPage'
import { APP_SEGMENTS as S } from './paths'

const LoginPage = lazy(() => import('@/features/auth/pages/LoginPage').then((m) => ({ default: m.LoginPage })))
const RegisterPage = lazy(() => import('@/features/auth/pages/RegisterPage').then((m) => ({ default: m.RegisterPage })))

const OrganizationSetupPage = lazy(() =>
  import('@/features/onboarding/pages/OrganizationSetupPage').then((m) => ({ default: m.OrganizationSetupPage })),
)
const PropertySetupPage = lazy(() =>
  import('@/features/onboarding/pages/PropertySetupPage').then((m) => ({ default: m.PropertySetupPage })),
)
const ReadyPage = lazy(() => import('@/features/onboarding/pages/ReadyPage').then((m) => ({ default: m.ReadyPage })))

const DashboardPage = lazy(() => import('@/features/dashboard/pages/DashboardPage').then((m) => ({ default: m.DashboardPage })))

const PropertiesListPage = lazy(() =>
  import('@/features/properties/pages/PropertiesListPage').then((m) => ({ default: m.PropertiesListPage })),
)
const PropertyCreatePage = lazy(() =>
  import('@/features/properties/pages/PropertyCreatePage').then((m) => ({ default: m.PropertyCreatePage })),
)
const PropertyDetailPage = lazy(() =>
  import('@/features/properties/pages/PropertyDetailPage').then((m) => ({ default: m.PropertyDetailPage })),
)
const PropertyEditPage = lazy(() =>
  import('@/features/properties/pages/PropertyEditPage').then((m) => ({ default: m.PropertyEditPage })),
)

const RoomsBedsPage = lazy(() => import('@/features/rooms/pages/RoomsBedsPage').then((m) => ({ default: m.RoomsBedsPage })))
const RoomDetailPage = lazy(() => import('@/features/rooms/pages/RoomDetailPage').then((m) => ({ default: m.RoomDetailPage })))

const TenantsPage = lazy(() => import('@/features/tenants/pages/TenantsPage').then((m) => ({ default: m.TenantsPage })))

const ResidencyCreatePage = lazy(() =>
  import('@/features/residency/pages/ResidencyCreatePage').then((m) => ({ default: m.ResidencyCreatePage })),
)
const ResidencyDetailPage = lazy(() =>
  import('@/features/residency/pages/ResidencyDetailPage').then((m) => ({ default: m.ResidencyDetailPage })),
)

const SettingsPage = lazy(() => import('@/features/organizations/pages/SettingsPage').then((m) => ({ default: m.SettingsPage })))

const BillingOverviewPage = lazy(() =>
  import('@/features/billing/pages/BillingOverviewPage').then((m) => ({ default: m.BillingOverviewPage })),
)
const InvoicesListPage = lazy(() =>
  import('@/features/billing/pages/InvoicesListPage').then((m) => ({ default: m.InvoicesListPage })),
)
const InvoiceDetailPage = lazy(() =>
  import('@/features/billing/pages/InvoiceDetailPage').then((m) => ({ default: m.InvoiceDetailPage })),
)
const RentPlansPage = lazy(() => import('@/features/billing/pages/RentPlansPage').then((m) => ({ default: m.RentPlansPage })))

const PaymentsListPage = lazy(() =>
  import('@/features/payments/pages/PaymentsListPage').then((m) => ({ default: m.PaymentsListPage })),
)
const PaymentDetailPage = lazy(() =>
  import('@/features/payments/pages/PaymentDetailPage').then((m) => ({ default: m.PaymentDetailPage })),
)

const ComplaintsListPage = lazy(() =>
  import('@/features/complaints/pages/ComplaintsListPage').then((m) => ({ default: m.ComplaintsListPage })),
)
const ComplaintDetailPage = lazy(() =>
  import('@/features/complaints/pages/ComplaintDetailPage').then((m) => ({ default: m.ComplaintDetailPage })),
)

const FoodOverviewPage = lazy(() =>
  import('@/features/food/pages/FoodOverviewPage').then((m) => ({ default: m.FoodOverviewPage })),
)
const FoodConfigurationPage = lazy(() =>
  import('@/features/food/pages/FoodConfigurationPage').then((m) => ({ default: m.FoodConfigurationPage })),
)
const FoodPlansPage = lazy(() => import('@/features/food/pages/FoodPlansPage').then((m) => ({ default: m.FoodPlansPage })))
const DailyMenuPage = lazy(() => import('@/features/food/pages/DailyMenuPage').then((m) => ({ default: m.DailyMenuPage })))
const WeeklyMenuPage = lazy(() => import('@/features/food/pages/WeeklyMenuPage').then((m) => ({ default: m.WeeklyMenuPage })))
const FoodSubscriptionsPage = lazy(() =>
  import('@/features/food/pages/FoodSubscriptionsPage').then((m) => ({ default: m.FoodSubscriptionsPage })),
)
const MealConsumptionPage = lazy(() =>
  import('@/features/food/pages/MealConsumptionPage').then((m) => ({ default: m.MealConsumptionPage })),
)

const ApplicationsListPage = lazy(() =>
  import('@/features/applications/pages/ApplicationsListPage').then((m) => ({ default: m.ApplicationsListPage })),
)
const ApplicationDetailPage = lazy(() =>
  import('@/features/applications/pages/ApplicationDetailPage').then((m) => ({ default: m.ApplicationDetailPage })),
)

const NotificationsPage = lazy(() =>
  import('@/features/notifications/pages/NotificationsPage').then((m) => ({ default: m.NotificationsPage })),
)

const VisitsListPage = lazy(() => import('@/features/visits/pages/VisitsListPage').then((m) => ({ default: m.VisitsListPage })))

function withSuspense(element: ReactNode) {
  return <Suspense fallback={<PageSpinner />}>{element}</Suspense>
}

/** Wraps a group of module routes in the same permission the sidebar uses to show that module. */
function guarded(permission: Permission, children: RouteObject[]): RouteObject {
  return { element: <RequirePermission permission={permission} />, errorElement: <RouteErrorBoundary />, children }
}

export const routeObjects: RouteObject[] = [
  {
    errorElement: <RouteErrorBoundary />,
    children: [
      { path: '/', element: <LandingPage /> },
      { path: '/login', element: withSuspense(<LoginPage />) },
      { path: '/register', element: withSuspense(<RegisterPage />) },
      {
        element: <RequireAuth />,
        children: [
          { path: '/onboarding/organization', element: withSuspense(<OrganizationSetupPage />) },
          { path: '/onboarding/property', element: withSuspense(<PropertySetupPage />) },
          { path: '/onboarding/ready', element: withSuspense(<ReadyPage />) },
          {
            path: '/app',
            element: <RequireOrganization />,
            children: [
              {
                element: <AppShellLayout />,
                children: [
                  { index: true, element: <Navigate to={S.dashboard} replace /> },
                  guarded('dashboard.view', [{ path: S.dashboard, element: withSuspense(<DashboardPage />) }]),
                  guarded('properties.view', [
                    { path: S.properties, element: withSuspense(<PropertiesListPage />) },
                    { path: `${S.properties}/new`, element: withSuspense(<PropertyCreatePage />) },
                    { path: `${S.properties}/:propertyId`, element: withSuspense(<PropertyDetailPage />) },
                    { path: `${S.properties}/:propertyId/edit`, element: withSuspense(<PropertyEditPage />) },
                  ]),
                  guarded('rooms.view', [
                    { path: S.rooms, element: withSuspense(<RoomsBedsPage />) },
                    { path: `${S.properties}/:propertyId/rooms/:roomId`, element: withSuspense(<RoomDetailPage />) },
                  ]),
                  guarded('tenants.view', [
                    { path: S.tenants, element: withSuspense(<TenantsPage />) },
                    { path: `${S.properties}/:propertyId/residencies/new`, element: withSuspense(<ResidencyCreatePage />) },
                    { path: 'residencies/:residencyId', element: withSuspense(<ResidencyDetailPage />) },
                  ]),
                  guarded('billing.view', [
                    { path: S.billing, element: withSuspense(<BillingOverviewPage />) },
                    { path: `${S.billing}/invoices`, element: withSuspense(<InvoicesListPage />) },
                    { path: `${S.billing}/invoices/:invoiceId`, element: withSuspense(<InvoiceDetailPage />) },
                    { path: `${S.billing}/rent-plans`, element: withSuspense(<RentPlansPage />) },
                  ]),
                  guarded('payments.view', [
                    { path: S.payments, element: withSuspense(<PaymentsListPage />) },
                    { path: `${S.payments}/:paymentId`, element: withSuspense(<PaymentDetailPage />) },
                  ]),
                  guarded('complaints.view', [
                    { path: S.complaints, element: withSuspense(<ComplaintsListPage />) },
                    { path: `${S.complaints}/:complaintId`, element: withSuspense(<ComplaintDetailPage />) },
                  ]),
                  guarded('food.view', [
                    { path: S.food, element: withSuspense(<FoodOverviewPage />) },
                    { path: `${S.food}/configuration`, element: withSuspense(<FoodConfigurationPage />) },
                    { path: `${S.food}/plans`, element: withSuspense(<FoodPlansPage />) },
                    { path: `${S.food}/menu`, element: withSuspense(<DailyMenuPage />) },
                    { path: `${S.food}/menu/week`, element: withSuspense(<WeeklyMenuPage />) },
                    { path: `${S.food}/subscriptions`, element: withSuspense(<FoodSubscriptionsPage />) },
                    { path: `${S.food}/consumption`, element: withSuspense(<MealConsumptionPage />) },
                  ]),
                  guarded('applications.view', [
                    { path: S.applications, element: withSuspense(<ApplicationsListPage />) },
                    { path: `${S.applications}/:applicationId`, element: withSuspense(<ApplicationDetailPage />) },
                  ]),
                  guarded('visits.view', [{ path: S.visits, element: withSuspense(<VisitsListPage />) }]),
                  guarded('notifications.view', [{ path: S.notifications, element: withSuspense(<NotificationsPage />) }]),
              guarded('organizations.view', [{ path: S.settings, element: withSuspense(<SettingsPage />) }]),
                  { path: '*', element: <NotFoundState /> },
                ],
              },
            ],
          },
        ],
      },
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
]

export const router = createBrowserRouter(routeObjects)
