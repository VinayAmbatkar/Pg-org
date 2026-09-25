import type { ReactNode } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { ErrorState } from './ErrorState'

interface QueryStateProps {
  isLoading: boolean
  error?: unknown
  onRetry?: () => void
  isEmpty?: boolean
  empty?: ReactNode
  children: ReactNode
}

/** The loading → error → empty → content sequence every data section needs. Error is checked
 * before empty on purpose: a failed request must never render as "nothing here yet". */
export function QueryState({ isLoading, error, onRetry, isEmpty, empty, children }: QueryStateProps) {
  if (isLoading) {
    return (
      <div className="space-y-2" aria-busy="true" aria-label="Loading">
        <Skeleton className="h-9 w-full" />
        <Skeleton className="h-9 w-full" />
        <Skeleton className="h-9 w-2/3" />
      </div>
    )
  }
  if (error) return <ErrorState compact error={error} onRetry={onRetry} />
  if (isEmpty) return <>{empty ?? <p className="text-sm text-muted-foreground">Nothing here yet.</p>}</>
  return <>{children}</>
}
