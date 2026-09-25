import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { PageSpinner } from '@/components/feedback/PageSpinner'
import { useAuth } from '@/infrastructure/auth/AuthProvider'

export function RequireAuth() {
  const { status } = useAuth()
  const location = useLocation()

  if (status === 'restoring') {
    return <PageSpinner label="Restoring your session…" />
  }

  if (status === 'unauthenticated') {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return <Outlet />
}
