import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http } from 'msw'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { tokenStorage } from '@/infrastructure/auth/tokenStorage'
import { testBeds, testRoom } from '@/test/handlers'
import { api, ok } from '@/test/msw'
import { renderApp, resetUiStore } from '@/test/renderApp'
import { server } from '@/test/server'
import type { Room } from '@/types/api'

// testRoom (204): DOUBLE, AC/WiFi/attached washroom, ₹8,500, 2 beds, bed A occupied by Rohit Sharma.
const single: Room = {
  ...testRoom,
  id: 'room-2',
  roomNumber: '101',
  roomType: 'SINGLE',
  capacity: 1,
  floor: 1,
  pricePerBed: '5500.00',
  amenities: ['WIFI', 'FAN'],
  occupancy: { totalBeds: 1, occupiedBeds: 1, vacantBeds: 0, blockedBeds: 0 },
}
const triple: Room = {
  ...testRoom,
  id: 'room-3',
  roomNumber: '305',
  roomType: 'TRIPLE',
  capacity: 3,
  floor: 3,
  pricePerBed: null,
  amenities: ['AC'],
  occupancy: { totalBeds: 1, occupiedBeds: 0, vacantBeds: 1, blockedBeds: 0 },
}

describe('Rooms & Beds page', () => {
  beforeEach(() => {
    resetUiStore()
    tokenStorage.setRefreshToken('valid-refresh-token')
    server.use(
      http.get(api('/properties/:propertyId/rooms'), () => ok([testRoom, single, triple])),
      http.get(api('/properties/:propertyId/rooms/:roomId/beds'), ({ params }) =>
        ok(
          params.roomId === testRoom.id
            ? testBeds
            : params.roomId === triple.id
              ? [{ ...testBeds[1], id: 'bed-c1', roomId: triple.id, bedNumber: 'C1' }]
              : [{ ...testBeds[0], id: 'bed-s1', roomId: single.id, bedNumber: 'S1' }],
        ),
      ),
    )
  })

  afterEach(() => {
    tokenStorage.clear()
  })

  const cards = () => within(screen.getByRole('list', { name: 'Rooms' }))

  it('shows exact occupancy stats, prices, amenities and who is in each bed', async () => {
    renderApp('/app/rooms')
    const stats = await screen.findByRole('region', { name: 'Room summary' })
    await waitFor(() => expect(within(stats).getByText('Occupied').closest('div')!.parentElement!.textContent).toContain('2'))
    expect(within(stats).getByText('Vacant').closest('div')!.parentElement!.textContent).toContain('2')

    const room204 = within(await screen.findByRole('list', { name: 'Beds in room 204' }))
    expect(room204.getByText('occupied by Rohit Sharma')).toBeInTheDocument()
    expect(room204.getByText('vacant')).toBeInTheDocument()
    expect(cards().getByText('₹8,500')).toBeInTheDocument()
    expect(cards().getAllByText('1 bed available').length).toBeGreaterThan(0)
    expect(within(cards().getByRole('heading', { name: 'Room 204' }).closest('.rounded-lg') as HTMLElement).getByText('AC')).toBeInTheDocument()
  })

  it('type tabs, floor and free-capacity filters narrow the grid and live in the URL', { timeout: 20_000 }, async () => {
    const user = userEvent.setup()
    const { router } = renderApp('/app/rooms')
    await screen.findByRole('list', { name: 'Beds in room 204' })
    await user.click(within(screen.getByRole('group', { name: 'Filter by room type' })).getByRole('button', { name: /single/i }))
    await waitFor(() => expect(router.state.location.search).toBe('?roomType=SINGLE'))
    expect(cards().getByRole('heading', { name: 'Room 101' })).toBeInTheDocument()
    expect(cards().queryByRole('heading', { name: 'Room 204' })).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /clear all/i }))
    await user.selectOptions(screen.getByLabelText('Floor'), '3rd floor')
    expect(cards().getByRole('heading', { name: 'Room 305' })).toBeInTheDocument()
    expect(cards().queryByRole('heading', { name: 'Room 101' })).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /clear all/i }))
    await user.click(screen.getByLabelText(/has room for more beds/i))
    await waitFor(() => expect(cards().queryByRole('heading', { name: 'Room 101' })).not.toBeInTheDocument())
    expect(cards().getByRole('heading', { name: 'Room 305' })).toBeInTheDocument()
  })

  it('amenity (incl. Non-AC), availability and price filters use the real room data', { timeout: 20_000 }, async () => {
    const user = userEvent.setup()
    const { router } = renderApp('/app/rooms')
    await screen.findByRole('list', { name: 'Beds in room 204' })
    const panel = within(screen.getByRole('complementary', { name: /find available room/i }))

    await user.click(panel.getByLabelText('Non-AC'))
    await waitFor(() => expect(router.state.location.search).toBe('?amen=NON_AC'))
    expect(cards().getByRole('heading', { name: 'Room 101' })).toBeInTheDocument()
    expect(cards().queryByRole('heading', { name: 'Room 204' })).not.toBeInTheDocument()

    await user.click(panel.getByLabelText('Non-AC'))
    await user.click(panel.getByLabelText(/only rooms with vacant beds/i))
    await waitFor(() => expect(cards().queryByRole('heading', { name: 'Room 101' })).not.toBeInTheDocument())
    expect(cards().getByRole('heading', { name: 'Room 204' })).toBeInTheDocument()
    expect(cards().getByRole('heading', { name: 'Room 305' })).toBeInTheDocument()

    await user.click(panel.getByLabelText(/empty rooms only/i))
    await waitFor(() => expect(cards().queryByRole('heading', { name: 'Room 204' })).not.toBeInTheDocument())
    expect(cards().getByRole('heading', { name: 'Room 305' })).toBeInTheDocument()
  })

  it('a price range from the URL hides rooms outside it and rooms with no price', async () => {
    renderApp('/app/rooms?pmin=6000')
    await screen.findByRole('heading', { name: 'Room 204' })
    expect(cards().queryByRole('heading', { name: 'Room 101' })).not.toBeInTheDocument()
    expect(cards().queryByRole('heading', { name: 'Room 305' })).not.toBeInTheDocument()
    expect(screen.getByRole('slider', { name: 'Minimum price per bed' })).toHaveValue('6000')
  })

  it('list view shows occupied / available counts per room from the URL, without per-room bed requests', async () => {
    let bedRequests = 0
    server.use(
      http.get(api('/properties/:propertyId/rooms/:roomId/beds'), () => {
        bedRequests += 1
        return ok([])
      }),
    )
    renderApp('/app/rooms?view=list')
    const table = await screen.findByRole('table', { name: 'Rooms' })
    const row204 = within(within(table).getByText('Room 204').closest('tr') as HTMLElement)
    expect(row204.getByText('AC · Double')).toBeInTheDocument()
    expect(row204.getByText('2nd')).toBeInTheDocument()
    const cells = within(table).getByText('Room 204').closest('tr')!.querySelectorAll('td')
    expect(cells[4].textContent).toBe('1 occupied')
    expect(cells[5].textContent).toBe('1 available')
    const row101 = within(table).getByText('Room 101').closest('tr')!.querySelectorAll('td')
    expect(row101[5].textContent).toBe('0 available')
    expect(row204.getByRole('link', { name: 'Open room 204' })).toHaveAttribute('href', '/app/properties/property-1/rooms/room-1')
    expect(screen.getByRole('button', { name: 'List' })).toHaveAttribute('aria-pressed', 'true')
    expect(bedRequests).toBe(0)
  })

  it('never writes a price range to the URL on its own (only after the user moves a handle)', async () => {
    const { router } = renderApp('/app/rooms')
    await screen.findByRole('heading', { name: 'Room 204' })
    await new Promise((r) => setTimeout(r, 700)) // beyond the slider's debounce
    expect(router.state.location.search).toBe('')
    expect(cards().getByRole('heading', { name: 'Room 101' })).toBeInTheDocument()
  })

  it('shows a filtered-empty state with a way out', async () => {
    const user = userEvent.setup()
    renderApp('/app/rooms?roomStatus=ARCHIVED')
    expect(await screen.findByText('No rooms match these filters')).toBeInTheDocument()
    await user.click(screen.getAllByRole('button', { name: /clear filters/i })[0])
    expect(await screen.findByRole('heading', { name: 'Room 204' })).toBeInTheDocument()
  })
})
