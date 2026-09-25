import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http } from 'msw'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { tokenStorage } from '@/infrastructure/auth/tokenStorage'
import { testInvoiceIssued } from '@/test/handlers'
import { api, failures, ok, pendingForever } from '@/test/msw'
import { renderApp, resetUiStore } from '@/test/renderApp'
import { server } from '@/test/server'

// Resilience across the HTTP states the brief requires (Success/Loading/Empty/401/403/404/409/500/
// Network), exercised through real pages. 401-refresh, 409 check-in and 500-dashboard have their own
// focused tests elsewhere; this file covers the rest end-to-end through the router.

async function shell() {
  await screen.findByRole('navigation', { name: 'Primary' }, { timeout: 5000 })
}

describe('API error experience', () => {
  beforeEach(() => {
    resetUiStore()
    tokenStorage.setRefreshToken('valid-refresh-token')
  })

  afterEach(() => {
    tokenStorage.clear()
  })

  it('loading: shows a busy skeleton, not an empty state, while a list is in flight', async () => {
    server.use(pendingForever('/properties/:propertyId/invoices'))
    renderApp('/app/billing/invoices')
    await shell()
    expect(await screen.findByLabelText('Loading Invoices')).toHaveAttribute('aria-busy', 'true')
    expect(screen.queryByText('No invoices yet')).not.toBeInTheDocument()
  })

  it('403: explains the permission problem in plain language', async () => {
    server.use(http.get(api('/complaints'), failures.forbidden))
    renderApp('/app/complaints')
    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent(/your role in this organization doesn't allow this action/i)
  })

  it('404: a missing invoice shows not-found copy rather than crashing', async () => {
    renderApp('/app/billing/invoices/does-not-exist')
    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent(/could not find/i)
  })

  it('500: never leaks backend internals into the UI', async () => {
    server.use(http.get(api('/complaints'), failures.server))
    renderApp('/app/complaints')
    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent(/something went wrong on our end/i)
    expect(alert).not.toHaveTextContent(/prisma|secret/i)
  })

  it('network failure: shows a retry that recovers once the connection is back', async () => {
    let attempts = 0
    server.use(
      http.get(api('/properties/:propertyId/invoices'), () => {
        attempts += 1
        return attempts === 1 ? failures.network() : ok([testInvoiceIssued])
      }),
    )
    const user = userEvent.setup()
    renderApp('/app/billing/invoices')
    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent(/unable to reach the server/i)

    await user.click(within(alert).getByRole('button', { name: /try again/i }))
    expect(await screen.findByText(testInvoiceIssued.invoiceNumber)).toBeInTheDocument()
  })

  it('429: rate limiting is surfaced with a wait-and-retry message (retry policy: queryClient.test.ts)', async () => {
    server.use(http.get(api('/complaints'), failures.rateLimited))
    renderApp('/app/complaints')
    expect(await screen.findByRole('alert')).toHaveTextContent(/too many requests/i)
  })

  it('unknown enum in the URL is ignored instead of being forwarded as a 400', async () => {
    let lastStatus: string | null = 'unset'
    server.use(
      http.get(api('/complaints'), ({ request }) => {
        lastStatus = new URL(request.url).searchParams.get('status')
        return ok({ items: [], total: 0, page: 1, limit: 20 })
      }),
    )
    renderApp('/app/complaints?status=NOT_A_STATUS')
    expect(await screen.findByText('No complaints')).toBeInTheDocument()
    expect(lastStatus).toBeNull()
  })

  it('unknown /app path renders an in-shell 404 instead of bouncing to the landing page', async () => {
    const { router } = renderApp('/app/this-does-not-exist')
    expect(await screen.findByRole('heading', { name: 'Page not found' })).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/app/this-does-not-exist')
    await shell()
  })
})
