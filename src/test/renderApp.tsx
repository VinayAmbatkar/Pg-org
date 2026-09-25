import { QueryClientProvider } from '@tanstack/react-query'
import { render } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { createQueryClient } from '@/app/providers/queryClient'
import { useUiStore } from '@/app/providers/uiStore'
import { routeObjects } from '@/app/router/routes'
import { ToastProvider } from '@/components/feedback/ToastProvider'
import { AuthProvider } from '@/infrastructure/auth/AuthProvider'

/** Renders the *real* application route table (guards, layout, lazy pages) at `route`, with the
 * same provider order as App.tsx. Use this for routing/navigation tests — renderWithProviders
 * mounts a single page and would not catch a sidebar/route mismatch. */
export function renderApp(route: string) {
  const queryClient = createQueryClient({ retry: false })
  const router = createMemoryRouter(routeObjects, { initialEntries: [route] })

  const result = render(
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <AuthProvider>
          <RouterProvider router={router} />
        </AuthProvider>
      </ToastProvider>
    </QueryClientProvider>,
  )

  return { ...result, router, queryClient }
}

/** Resets persisted client UI state (current org/property, sidebar) between tests. */
export function resetUiStore() {
  useUiStore.setState({ sidebarCollapsed: false, currentOrganizationId: null, currentPropertyId: null })
}
