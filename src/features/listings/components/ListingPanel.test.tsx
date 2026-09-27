import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { env } from '@/app/config/env'
import { tokenStorage } from '@/infrastructure/auth/tokenStorage'
import { renderApp, resetUiStore } from '@/test/renderApp'
import { testOrganization, testProperty } from '@/test/handlers'
import { server } from '@/test/server'
import type { Listing } from '../types'

const ok = (data: unknown) => HttpResponse.json({ success: true, data, requestId: 't' })
const fail = (status: number, code: string, message: string) =>
  HttpResponse.json({ success: false, error: { code, message }, requestId: 't' }, { status })

const DTO_FIELDS = ['title', 'description', 'locality', 'latitude', 'longitude', 'coverImageUrl', 'contactEnabled', 'startingFromPrice', 'amenities']

// Stateful stand-in for pg-backend's /properties/:id/listing routes (property-listings.controller.ts),
// including its forbidNonWhitelisted validation and the publish completeness check.
function mockListing(initial: Partial<Listing> = {}) {
  const calls: { method: string; path: string; body?: Record<string, unknown> }[] = []
  let listing: Listing = {
    id: 'listing-1',
    organizationId: testProperty.organizationId,
    propertyId: testProperty.id,
    status: 'DRAFT',
    title: null,
    description: null,
    city: testProperty.city,
    locality: null,
    latitude: null,
    longitude: null,
    coverImageUrl: null,
    contactEnabled: true,
    startingFromPrice: null,
    amenities: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    publishedAt: null,
    ...initial,
  }
  const base = `${env.apiUrl}/properties/:propertyId/listing`
  server.use(
    http.get(base, () => ok(listing)),
    http.patch(base, async ({ request }) => {
      const body = (await request.json()) as Record<string, unknown>
      calls.push({ method: 'PATCH', path: 'listing', body })
      const extra = Object.keys(body).filter((k) => !DTO_FIELDS.includes(k))
      if (extra.length) return fail(400, 'VALIDATION_FAILED', `property ${extra[0]} should not exist`)
      listing = {
        ...listing,
        ...body,
        startingFromPrice: body.startingFromPrice !== undefined ? Number(body.startingFromPrice).toFixed(2) : listing.startingFromPrice,
      } as Listing
      return ok(listing)
    }),
    http.post(`${base}/publish`, () => {
      calls.push({ method: 'POST', path: 'publish' })
      if (!listing.title || !listing.description || !listing.city || !listing.locality) {
        return fail(400, 'LISTING_INCOMPLETE', 'title, description, city and locality are required to publish a listing.')
      }
      listing = { ...listing, status: 'PUBLISHED', publishedAt: new Date().toISOString() }
      return ok(listing)
    }),
    http.post(`${base}/unpublish`, () => {
      calls.push({ method: 'POST', path: 'unpublish' })
      listing = { ...listing, status: 'UNPUBLISHED' }
      return ok(listing)
    }),
  )
  return { calls, current: () => listing }
}

// The real route table (data router): the listing form's unsaved-changes guard uses useBlocker.
function renderListingTab() {
  return renderApp(`/app/properties/${testProperty.id}?tab=listing`)
}

describe('Property → Listing tab', () => {
  beforeEach(() => {
    resetUiStore()
    tokenStorage.setRefreshToken('valid-refresh-token')
  })
  afterEach(() => tokenStorage.clear())

  it('shows a draft with what is missing, and Publish disabled', async () => {
    mockListing()
    renderListingTab()
    expect(await screen.findByText('Draft')).toBeInTheDocument()
    expect(screen.getByText(/needed before publishing/i).parentElement).toHaveTextContent('Title, Description, Locality')
    expect(screen.getByRole('button', { name: /publish/i })).toBeDisabled()
    expect(screen.getByLabelText('City')).toHaveValue(testProperty.city)
  })

  it('saves details (only DTO fields), then publishes', async () => {
    const user = userEvent.setup()
    const backend = mockListing()
    renderListingTab()
    await user.type(await screen.findByLabelText('Title'), 'Sunrise PG for professionals')
    await user.type(screen.getByLabelText('Description'), 'Clean rooms near the metro.')
    await user.type(screen.getByLabelText(/locality/i), 'Madhapur')
    await user.type(screen.getByLabelText(/starting from price/i), '8500')
    await user.click(screen.getByLabelText('Wi-Fi'))
    await user.click(screen.getByLabelText('Food'))

    // Unsaved edits block publishing.
    expect(screen.getByRole('button', { name: /publish/i })).toBeDisabled()
    await user.click(screen.getByRole('button', { name: 'Save listing' }))
    await waitFor(() => expect(backend.calls.filter((c) => c.method === 'PATCH')).toHaveLength(1))
    expect(backend.calls[0].body).toEqual({
      title: 'Sunrise PG for professionals',
      description: 'Clean rooms near the metro.',
      locality: 'Madhapur',
      coverImageUrl: '',
      startingFromPrice: 8500,
      amenities: ['WIFI', 'FOOD'],
    })

    expect(await screen.findByText(/ready to publish/i)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /^publish$/i }))
    expect(await screen.findByText('Published')).toBeInTheDocument()
    expect(backend.current().status).toBe('PUBLISHED')
    expect(screen.getByRole('button', { name: /unpublish/i })).toBeInTheDocument()
  })

  it('unpublishes after confirmation', async () => {
    const user = userEvent.setup()
    const backend = mockListing({ status: 'PUBLISHED', title: 'T', description: 'D', locality: 'L', publishedAt: new Date().toISOString() })
    renderListingTab()
    await user.click(await screen.findByRole('button', { name: /unpublish/i }))
    const dialog = await screen.findByRole('dialog', { name: 'Unpublish this listing?' })
    await user.click(within(dialog).getByRole('button', { name: 'Unpublish' }))
    expect(await screen.findByText('Unpublished')).toBeInTheDocument()
    expect(backend.current().status).toBe('UNPUBLISHED')
  })

  it('validates the image URL and never sends an unsafe one', async () => {
    const user = userEvent.setup()
    const backend = mockListing()
    renderListingTab()
    await user.type(await screen.findByLabelText(/cover image url/i), 'javascript:alert(1)')
    await user.click(screen.getByRole('button', { name: 'Save listing' }))
    expect(await screen.findByText(/full image url/i)).toBeInTheDocument()
    expect(backend.calls).toHaveLength(0)
  })

  it('blocks clearing a price the backend cannot clear', async () => {
    const user = userEvent.setup()
    const backend = mockListing({ startingFromPrice: '9000.00' })
    renderListingTab()
    const price = await screen.findByLabelText(/starting from price/i)
    expect(price).toHaveValue('9000')
    await user.clear(price)
    await user.click(screen.getByRole('button', { name: 'Save listing' }))
    expect(await screen.findByText(/can't be removed once set/i)).toBeInTheDocument()
    expect(backend.calls).toHaveLength(0)
  })

  it('STAFF can view but not edit or publish', async () => {
    mockListing({ status: 'PUBLISHED', title: 'T', description: 'D', locality: 'L' })
    server.use(http.get(`${env.apiUrl}/organizations`, () => ok([{ ...testOrganization, yourRole: 'STAFF' }])))
    renderListingTab()
    expect(await screen.findByText('Published')).toBeInTheDocument()
    expect(screen.getByLabelText('Title')).toBeDisabled()
    expect(screen.queryByRole('button', { name: /publish/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Save listing' })).not.toBeInTheDocument()
  })
})
