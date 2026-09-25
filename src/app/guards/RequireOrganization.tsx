import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/infrastructure/auth/AuthProvider'

/** Everything under /app requires at least one organization — there is no way to operate a
 * property without one, and onboarding is the only place that creates the first org. */
export function RequireOrganization() {
  const { organizations } = useAuth()

  if (organizations.length === 0) {
    return <Navigate to="/onboarding/organization" replace />
  }

  return <Outlet />
}
