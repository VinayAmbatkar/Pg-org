import { ShieldAlert } from 'lucide-react'
import { Link, Outlet } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/feedback/EmptyState'
import { useCurrentOrganization } from '@/features/organizations/hooks/useCurrentOrganization'
import { hasPermission, type Permission } from '@/infrastructure/permissions/permissions'
import { APP_PATHS } from '../router/paths'

/** Route-level permission gate. The sidebar already hides items the role can't use, but a
 * direct URL / bookmark / refresh bypasses the sidebar, so each module route checks the same
 * permission here. This is UX only — pg-backend remains the authority and still returns 403. */
export function RequirePermission({ permission }: { permission: Permission }) {
  const organization = useCurrentOrganization()

  if (!hasPermission(organization?.yourRole, permission)) {
    return (
      <EmptyState
        icon={ShieldAlert}
        title="You don't have access to this page"
        description="Your role in this organization doesn't include this module. Ask the organization owner if you need access."
        action={
          <Link to={APP_PATHS.dashboard}>
            <Button size="sm">Back to Dashboard</Button>
          </Link>
        }
      />
    )
  }

  return <Outlet />
}
