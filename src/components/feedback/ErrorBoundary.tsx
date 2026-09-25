import { Component, type ErrorInfo, type ReactNode } from 'react'
import { isRouteErrorResponse, Link, useRouteError } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { ErrorState } from './ErrorState'

interface ErrorBoundaryProps {
  children: ReactNode
  /** Rendered instead of children after a render error. Receives a reset callback. */
  fallback: (reset: () => void) => ReactNode
  /** Any change to these values clears the error (e.g. the selected property changed). */
  resetKeys?: unknown[]
}

interface ErrorBoundaryState {
  hasError: boolean
  resetKeys: unknown[]
}

const keysChanged = (a: unknown[], b: unknown[]) => a.length !== b.length || a.some((value, i) => !Object.is(value, b[i]))

/** Catches *render* errors (a chart throwing on unexpected data, etc.). Data-fetching errors are
 * handled by each query's own error state and never reach here. */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false, resetKeys: this.props.resetKeys ?? [] }

  static getDerivedStateFromError(): Partial<ErrorBoundaryState> {
    return { hasError: true }
  }

  // Clear the error when a reset key changes (e.g. the selected property), computed during render
  // rather than via setState in componentDidUpdate.
  static getDerivedStateFromProps(props: ErrorBoundaryProps, state: ErrorBoundaryState): Partial<ErrorBoundaryState> | null {
    const next = props.resetKeys ?? []
    if (!keysChanged(state.resetKeys, next)) return null
    return { resetKeys: next, hasError: false }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Dev-only diagnostics. Production builds never log errors to the console (they can contain
    // request data); wire an error-reporting service here when one is adopted.
    if (import.meta.env.DEV) console.error('[ErrorBoundary]', error, info.componentStack)
  }

  reset = () => this.setState({ hasError: false })

  render() {
    if (this.state.hasError) return this.props.fallback(this.reset)
    return this.props.children
  }
}

/** Feature-level boundary: one broken card/section shows a compact recovery box and the rest of the
 * page keeps working. */
export function SectionBoundary({ children, resetKeys, title }: { children: ReactNode; resetKeys?: unknown[]; title?: string }) {
  return (
    <ErrorBoundary
      resetKeys={resetKeys}
      fallback={(reset) => (
        <ErrorState compact title={title ?? 'This section failed to display'} error={null} onRetry={reset} />
      )}
    >
      {children}
    </ErrorBoundary>
  )
}

/** Last-resort boundary around the whole app (outside the router). */
export function GlobalErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary
      fallback={() => (
        <div className="flex min-h-screen items-center justify-center bg-background p-6">
          <div className="max-w-md space-y-4 text-center">
            <h1 className="text-xl font-semibold">Something went wrong</h1>
            <p className="text-sm text-muted-foreground">
              PGMet hit an unexpected error. Reloading usually fixes it. Your data is safe.
            </p>
            <Button onClick={() => window.location.reload()}>Reload PGMet</Button>
          </div>
        </div>
      )}
    >
      {children}
    </ErrorBoundary>
  )
}

function isChunkLoadError(error: unknown) {
  return (
    error instanceof Error &&
    /Failed to fetch dynamically imported module|Importing a module script failed|error loading dynamically imported module/i.test(
      error.message,
    )
  )
}

/** Router `errorElement`: a page that throws while rendering (or whose lazy chunk fails to load,
 * typically after a new deploy) shows this inside the route instead of React Router's default dev
 * screen. */
export function RouteErrorBoundary() {
  const error = useRouteError()

  if (isRouteErrorResponse(error) && error.status === 404) {
    return <NotFoundState />
  }

  const chunkFailed = isChunkLoadError(error)
  if (import.meta.env.DEV && !chunkFailed) console.error('[RouteErrorBoundary]', error)

  return (
    <div role="alert" className="mx-auto flex max-w-md flex-col items-center gap-3 py-20 text-center">
      <h1 className="text-xl font-semibold">{chunkFailed ? 'A new version of PGMet is available' : 'This page failed to load'}</h1>
      <p className="text-sm text-muted-foreground">
        {chunkFailed
          ? 'Reload to get the latest version.'
          : 'Something went wrong while showing this page. Try reloading, or go back to the dashboard.'}
      </p>
      <div className="flex gap-2">
        <Button onClick={() => window.location.reload()}>Reload</Button>
        <Link to="/app/dashboard">
          <Button variant="outline">Dashboard</Button>
        </Link>
      </div>
    </div>
  )
}

export function NotFoundState() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-3 py-20 text-center">
      <h1 className="text-xl font-semibold">Page not found</h1>
      <p className="text-sm text-muted-foreground">This page doesn&apos;t exist or may have moved.</p>
      <Link to="/app/dashboard">
        <Button variant="outline">Back to Dashboard</Button>
      </Link>
    </div>
  )
}
