import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ApiError } from '@/infrastructure/api/errors'
import { cn } from '@/lib/utils/cn'

interface ErrorStateProps {
  error: unknown
  onRetry?: () => void
  /** Smaller variant for a failed section inside a page (a card, a tab), not the whole page. */
  compact?: boolean
  title?: string
}

export function ErrorState({ error, onRetry, compact = false, title = 'Unable to load data' }: ErrorStateProps) {
  const message = error instanceof ApiError ? error.message : 'Something went wrong. Please try again.'

  return (
    <div
      role="alert"
      className={cn(
        'flex flex-col items-center justify-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 text-center',
        compact ? 'px-4 py-6' : 'gap-3 py-16',
      )}
    >
      <AlertTriangle className={cn('text-destructive', compact ? 'h-6 w-6' : 'h-10 w-10')} aria-hidden="true" />
      <p className="text-sm font-medium text-foreground">{title}</p>
      <p className="max-w-sm text-sm text-muted-foreground">{message}</p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  )
}
