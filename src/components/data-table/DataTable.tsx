import type { ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { ErrorState } from '@/components/feedback/ErrorState'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils/cn'

export interface DataTableColumn<T> {
  key: string
  header: string
  render: (row: T) => ReactNode
  className?: string
}

export interface DataTablePagination {
  page: number
  limit: number
  total: number
  onPageChange: (page: number) => void
}

interface DataTableProps<T> {
  /** Screen-reader caption naming the table (visually hidden). */
  caption?: string
  columns: DataTableColumn<T>[]
  data: T[] | undefined
  rowKey: (row: T) => string
  isLoading?: boolean
  error?: unknown
  onRetry?: () => void
  emptyState: ReactNode
  onRowClick?: (row: T) => void
  pagination?: DataTablePagination
}

/** The one reusable table foundation for the app: handles loading/empty/error/pagination
 * so feature pages only ever define columns + a row renderer. */
export function DataTable<T>({
  caption,
  columns,
  data,
  rowKey,
  isLoading,
  error,
  onRetry,
  emptyState,
  onRowClick,
  pagination,
}: DataTableProps<T>) {
  if (error) {
    return <ErrorState error={error} onRetry={onRetry} />
  }

  if (isLoading) {
    return (
      <div className="space-y-2" aria-busy="true" aria-label={caption ? `Loading ${caption}` : 'Loading'}>
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    )
  }

  if (!data || data.length === 0) {
    return <>{emptyState}</>
  }

  const totalPages = pagination ? Math.max(1, Math.ceil(pagination.total / pagination.limit)) : null

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full min-w-[640px] text-left text-sm">
          {caption && <caption className="sr-only">{caption}</caption>}
          <thead className="border-b border-border bg-muted/50">
            <tr>
              {columns.map((col) => (
                <th key={col.key} scope="col" className={cn('px-4 py-3 font-medium text-muted-foreground', col.className)}>
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row) => (
              <tr
                key={rowKey(row)}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                onKeyDown={
                  onRowClick
                    ? (event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault()
                          onRowClick(row)
                        }
                      }
                    : undefined
                }
                // No role override: role="button" on a <tr> strips row/cell semantics for screen
                // readers. The row stays a row; it's focusable and opens on Enter/Space.
                tabIndex={onRowClick ? 0 : undefined}
                className={cn(
                  'border-b border-border last:border-0',
                  onRowClick && 'cursor-pointer hover:bg-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset',
                )}
              >
                {columns.map((col) => (
                  <td key={col.key} className={cn('px-4 py-3', col.className)}>
                    {col.render(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pagination && totalPages && totalPages > 1 && (
        <nav aria-label="Pagination" className="flex items-center justify-between text-sm text-muted-foreground">
          <span aria-live="polite">
            Page {pagination.page} of {totalPages} · {pagination.total} total
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page <= 1}
              onClick={() => pagination.onPageChange(pagination.page - 1)}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page >= totalPages}
              onClick={() => pagination.onPageChange(pagination.page + 1)}
            >
              Next
            </Button>
          </div>
        </nav>
      )}
    </div>
  )
}
