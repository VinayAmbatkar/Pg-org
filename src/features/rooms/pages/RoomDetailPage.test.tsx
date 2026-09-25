import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { tokenStorage } from '@/infrastructure/auth/tokenStorage'
import { testOrganization, testResidencyActive, testRoom } from '@/test/handlers'
import { api, ok } from '@/test/msw'
import { renderApp, resetUiStore } from '@/test/renderApp'
import { server } from '@/test/server'

const ROOM_URL = `/app/properties/property-1/rooms/${testRoom.id}`

describe('Room detail page', () => {
  beforeEach(() => {
    resetUiStore()
    tokenStorage.setRefreshToken('valid-refresh-token')
  })

  afterEach(() => {
    tokenStorage.clear()
  })

  it('shows the header, exact stats, info panel and the bed layout with occupants', async () => {
    renderApp(ROOM_URL)
    expect(await screen.findByRole('heading', { level: 1, name: 'Room 204' })).toBeInTheDocument()
    expect(screen.getByText('AC · Double sharing · 2nd floor')).toBeInTheDocument()
    expect(screen.getByRole('navigation', { name: 'Breadcrumb' })).toHaveTextContent('Rooms & Beds')

    const stats = within(screen.getByRole('region', { name: 'Room summary' }))
    expect(stats.getByText('Rent per bed').closest('div')!.parentElement!.textContent).toContain('₹8,500')

    const occupied = await screen.findByRole('link', { name: 'Rohit Sharma, open tenant' })
    expect(occupied).toHaveAttribute('href', '/app/residencies/residency-1')
    expect(screen.getByRole('button', { name: 'Assign a tenant to bed B' })).toBeInTheDocument()

    const info = within(screen.getByRole('complementary', { name: 'Room information' }))
    expect(info.getByText('Occupied beds').nextElementSibling).toHaveTextContent('1')
    expect(info.getByText('Attached washroom')).toBeInTheDocument()
    expect(info.getByText('Corner room with a balcony view.')).toBeInTheDocument()
  })

  it('assigns a waiting tenant to a vacant bed via check-in', async () => {
    let checkInBody: unknown = null
    server.use(
      http.get(api('/properties/:propertyId/residencies'), () =>
        ok([testResidencyActive, { ...testResidencyActive, id: 'residency-pending', tenantId: 'waiting-tenant-9', status: 'PENDING' }]),
      ),
      http.post(api('/residencies/:id/check-in'), async ({ params, request }) => {
        checkInBody = { id: params.id, ...((await request.json()) as object) }
        return ok({ residency: { ...testResidencyActive, id: 'residency-pending' }, allocation: { id: 'a', residencyId: 'residency-pending', bedId: 'x', startDate: '', endDate: null, status: 'ACTIVE', createdAt: '' } })
      }),
    )
    const user = userEvent.setup()
    renderApp(ROOM_URL)
    await user.click(await screen.findByRole('button', { name: 'Assign a tenant to bed B' }))
    const dialog = within(await screen.findByRole('dialog', { name: 'Assign bed B' }))
    await user.selectOptions(await dialog.findByLabelText('Tenant'), dialog.getByRole('option', { name: /waiting-/ }))
    await user.click(dialog.getByRole('button', { name: 'Check in' }))

    await waitFor(() => expect(checkInBody).toEqual({ id: 'residency-pending', bedId: '0b7f3a8e-1c2d-4e5f-8a9b-000000000002' }))
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
  })

  it('Tenants and History tabs list current occupants and past check-ins', async () => {
    const user = userEvent.setup()
    const { router } = renderApp(ROOM_URL)
    await user.click(await screen.findByRole('tab', { name: 'Tenants (1)' }))
    const tenants = await screen.findByRole('table', { name: 'Tenants in room 204' })
    expect(within(tenants).getByText('9876500001')).toBeInTheDocument()
    expect(within(tenants).getByText('₹8,500.00')).toBeInTheDocument()

    await user.click(screen.getByRole('tab', { name: 'History' }))
    await waitFor(() => expect(router.state.location.search).toBe('?tab=history'))
    const history = await screen.findByRole('table', { name: 'Room history' })
    expect(within(history).getByText('Rohit Sharma')).toBeInTheDocument()
    expect(within(history).getByText('Staying')).toBeInTheDocument()
  })

  it('edits price and amenities; emptied fields are sent as null to clear them', async () => {
    let patch: Record<string, unknown> | null = null
    server.use(
      http.patch(api('/properties/:propertyId/rooms/:roomId'), async ({ request }) => {
        patch = (await request.json()) as Record<string, unknown>
        return ok({ ...testRoom, ...patch })
      }),
    )
    const user = userEvent.setup()
    renderApp(ROOM_URL)
    await user.click(await screen.findByRole('button', { name: /edit room/i }))
    const dialog = within(await screen.findByRole('dialog', { name: 'Edit room' }))
    expect(dialog.getByLabelText('Price / bed (₹)')).toHaveValue('8500')
    await user.clear(dialog.getByLabelText('Price / bed (₹)'))
    await user.type(dialog.getByLabelText('Price / bed (₹)'), '9000')
    await user.click(dialog.getByLabelText('TV'))
    await user.click(dialog.getByLabelText('WiFi'))
    await user.clear(dialog.getByLabelText('Description (optional)'))
    await user.click(dialog.getByRole('button', { name: 'Save changes' }))

    await waitFor(() => expect(patch).not.toBeNull())
    expect(patch).toMatchObject({ pricePerBed: '9000', description: null, imageUrl: null })
    expect((patch!.amenities as string[]).sort()).toEqual(['AC', 'ATTACHED_WASHROOM', 'TV'])
  })

  it('rejects an unsafe photo link before sending it', async () => {
    const user = userEvent.setup()
    renderApp(ROOM_URL)
    await user.click(await screen.findByRole('button', { name: /add photo/i }))
    const dialog = within(await screen.findByRole('dialog', { name: 'Add photo' }))
    await user.type(dialog.getByLabelText('Image link'), 'javascript:alert(1)')
    await user.click(dialog.getByRole('button', { name: 'Save photo' }))
    expect(await dialog.findByRole('alert')).toHaveTextContent(/http\(s\)/)
  })

  it('STAFF sees the layout but no edit, archive or assign controls', async () => {
    server.use(
      http.get(api('/organizations'), () =>
        HttpResponse.json({ success: true, data: [{ ...testOrganization, yourRole: 'STAFF' }], requestId: 't' }),
      ),
    )
    renderApp(ROOM_URL)
    await screen.findByRole('link', { name: 'Rohit Sharma, open tenant' })
    expect(screen.queryByRole('button', { name: /edit room/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Archive room' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /assign a tenant/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /edit bed/i })).not.toBeInTheDocument()
  })
})
