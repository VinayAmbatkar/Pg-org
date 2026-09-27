import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { env } from '@/app/config/env'
import { tokenStorage } from '@/infrastructure/auth/tokenStorage'
import { testProperty, testResidencyActive } from '@/test/handlers'
import { renderApp, resetUiStore } from '@/test/renderApp'
import { server } from '@/test/server'

const RESOLVED_ID = '8f3c2a1b-9e44-4c1d-8a2b-1234567890ab'
const addTenantPath = `/app/properties/${testProperty.id}/residencies/new`

function captureCreate() {
  const bodies: unknown[] = []
  server.use(
    http.post(`${env.apiUrl}/properties/:propertyId/residencies`, async ({ request }) => {
      bodies.push(await request.json())
      return HttpResponse.json({ success: true, data: testResidencyActive, requestId: 't' }, { status: 201 })
    }),
  )
  return bodies
}

describe('Add Tenant (residency create) with tenant codes', () => {
  beforeEach(() => {
    resetUiStore()
    tokenStorage.setRefreshToken('valid-refresh-token')
  })
  afterEach(() => tokenStorage.clear())

  it('pre-fills the code from "Continue to check-in" and shows who it is', async () => {
    renderApp(`${addTenantPath}?tenant=TN-8R4M-2QXD`)
    expect(await screen.findByLabelText('Tenant code')).toHaveValue('TN-8R4M-2QXD')
    expect(await screen.findByText('Priya Tenant')).toBeInTheDocument()
  })

  it('resolves a typed code (loose format) and submits the real tenantId', async () => {
    const user = userEvent.setup()
    const bodies = captureCreate()
    renderApp(addTenantPath)
    await user.type(await screen.findByLabelText('Tenant code'), 'tn 8r4m 2qxd')
    await user.click(screen.getByRole('button', { name: 'Find' }))
    expect(await screen.findByText('Priya Tenant')).toBeInTheDocument()

    await user.type(screen.getByLabelText('Start Date'), '2026-10-01')
    await user.click(screen.getByRole('button', { name: 'Add tenant' }))
    await waitFor(() => expect(bodies).toHaveLength(1))
    expect(bodies[0]).toEqual({ tenantId: RESOLVED_ID, startDate: '2026-10-01' })
  })

  it('explains an unknown code and does not submit', async () => {
    const user = userEvent.setup()
    const bodies = captureCreate()
    renderApp(addTenantPath)
    await user.type(await screen.findByLabelText('Tenant code'), 'TN-0000-0000')
    await user.type(screen.getByLabelText('Start Date'), '2026-10-01')
    await user.click(screen.getByRole('button', { name: 'Add tenant' }))
    expect(await screen.findByText(/no tenant found with this code/i)).toBeInTheDocument()
    expect(bodies).toHaveLength(0)
  })

  it('still accepts a full tenant ID without a lookup', async () => {
    const user = userEvent.setup()
    const bodies = captureCreate()
    renderApp(addTenantPath)
    await user.type(await screen.findByLabelText('Tenant code'), RESOLVED_ID)
    await user.type(screen.getByLabelText('Start Date'), '2026-10-01')
    await user.click(screen.getByRole('button', { name: 'Add tenant' }))
    await waitFor(() => expect(bodies).toHaveLength(1))
    expect(bodies[0]).toMatchObject({ tenantId: RESOLVED_ID })
  })

  it('rejects something that is neither a code nor an ID', async () => {
    const user = userEvent.setup()
    renderApp(addTenantPath)
    await user.type(await screen.findByLabelText('Tenant code'), 'hello')
    await user.click(screen.getByRole('button', { name: 'Add tenant' }))
    expect(await screen.findByText(/enter a tenant code like/i)).toBeInTheDocument()
  })
})
