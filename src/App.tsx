import { RouterProvider } from 'react-router-dom'
import { GlobalErrorBoundary } from '@/components/feedback/ErrorBoundary'
import { ToastProvider } from '@/components/feedback/ToastProvider'
import { AuthProvider } from '@/infrastructure/auth/AuthProvider'
import { QueryProvider } from './app/providers/QueryProvider'
import { router } from './app/router/routes'

export function App() {
  return (
    <GlobalErrorBoundary>
      <QueryProvider>
        <ToastProvider>
          <AuthProvider>
            <RouterProvider router={router} />
          </AuthProvider>
        </ToastProvider>
      </QueryProvider>
    </GlobalErrorBoundary>
  )
}
