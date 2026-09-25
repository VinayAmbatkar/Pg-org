import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { env } from '@/app/config/env'
import { tokenStorage } from '@/infrastructure/auth/tokenStorage'
import { renderApp, resetUiStore } from '@/test/renderApp'
import { server } from '@/test/server'
import type { AppNotification } from '@/types/api'

const api = (path: string) => `${env.apiUrl}${path}`
const ok = <T,>(data: T) => HttpResponse.json({ success: true, data, requestId: 't' })
const COMPLAINT_ID = '3f2b1c9e-8a7d-4e6f-9b1a-2c3d4e5f6a7b'

function fixtures(): AppNotification[] {
  return [
    {
      id: 'n1',
      type: 'COMPLAINT_CREATED',
      title: 'New complaint',
      body: 'Leaking tap in room 204',
      priority: 'HIGH',
      data: { screen: 'COMPLAINT', complaintId: COMPLAINT_ID },
      isRead: false,
      readAt: null,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'n2',
      type: 'SYSTEM',
      title: 'Welcome to PGMet',
      body: 'Your account is ready',
      priority: 'NORMAL',
      data: null,
      isRead: false,
      readAt: null,
      createdAt: new Date().toISOString(),
    },
  ]
}

describe('notifications', () => {
  let store: AppNotification[]
  let listRequests: URL[]

  beforeEach(() => {
    resetUiStore()
    tokenStorage.setRefreshToken('valid-refresh-token')
    store = fixtures()
    listRequests = []
    server.use(
      http.get(api('/me/notifications'), ({ request }) => {
        const url = new URL(request.url)
        listRequests.push(url)
        const unreadOnly = url.searchParams.get('unreadOnly') === 'true'
        const items = unreadOnly ? store.filter((n) => !n.isRead) : store
        return ok({ items, total: items.length, page: 1, limit: 20 })
      }),
      http.get(api('/me/notifications/unread-count'), () => ok({ count: store.filter((n) => !n.isRead).length })),
      http.post(api('/me/notifications/:id/read'), ({ params }) => {
        store = store.map((n) => (n.id === params.id ? { ...n, isRead: true, readAt: new Date().toISOString() } : n))
        return ok(store.find((n) => n.id === params.id))
      }),
    )
  })

  afterEach(() => {
    tokenStorage.clear()
  })

  it('does not fetch the list until the popover is opened; badge uses the unread count', async () => {
    const user = userEvent.setup()
    renderApp('/app/properties')
    const bell = await screen.findByRole('button', { name: 'Notifications (2 unread)' }, { timeout: 5000 })
    expect(listRequests).toHaveLength(0)

    await user.click(bell)
    const panel = await screen.findByRole('region', { name: 'Recent notifications' })
    expect(await within(panel).findByText('New complaint')).toBeInTheDocument()
    expect(listRequests).toHaveLength(1)
    // "All" must omit unreadOnly (pg-backend would coerce the string "false" to true).
    expect(listRequests[0].searchParams.has('unreadOnly')).toBe(false)
  })

  it('deep-links from notification metadata and marks it read (optimistically)', async () => {
    const user = userEvent.setup()
    const { router } = renderApp('/app/properties')
    await user.click(await screen.findByRole('button', { name: /notifications/i }, { timeout: 5000 }))
    const link = await screen.findByRole('link', { name: /new complaint/i })
    expect(link).toHaveAttribute('href', `/app/complaints/${COMPLAINT_ID}`)

    await user.click(link)
    await waitFor(() => expect(router.state.location.pathname).toBe(`/app/complaints/${COMPLAINT_ID}`))
    expect(await screen.findByRole('button', { name: 'Notifications (1 unread)' })).toBeInTheDocument()
  })

  it('gives link-less notifications an explicit Mark as read button', async () => {
    const user = userEvent.setup()
    renderApp('/app/properties')
    await user.click(await screen.findByRole('button', { name: /notifications/i }, { timeout: 5000 }))
    const panel = await screen.findByRole('region', { name: 'Recent notifications' })
    await within(panel).findByText('Welcome to PGMet')
    await user.click(within(panel).getByRole('button', { name: 'Mark as read' }))
    expect(await screen.findByRole('button', { name: 'Notifications (1 unread)' })).toBeInTheDocument()
  })

  it('rolls back the optimistic update when marking read fails', async () => {
    server.use(
      http.post(api('/me/notifications/:id/read'), () =>
        HttpResponse.json({ success: false, error: { code: 'INTERNAL_SERVER_ERROR', message: 'x' } }, { status: 500 }),
      ),
    )
    const user = userEvent.setup()
    renderApp('/app/properties')
    await user.click(await screen.findByRole('button', { name: /notifications/i }, { timeout: 5000 }))
    const panel = await screen.findByRole('region', { name: 'Recent notifications' })
    await within(panel).findByText('Welcome to PGMet')
    await user.click(within(panel).getByRole('button', { name: 'Mark as read' }))
    await waitFor(() => expect(screen.getByRole('button', { name: 'Notifications (2 unread)' })).toBeInTheDocument())
    expect(within(panel).getByRole('button', { name: 'Mark as read' })).toBeInTheDocument()
  })

  it('history page filters to unread via the URL and sends unreadOnly=true', async () => {
    renderApp('/app/notifications?filter=unread')
    expect(await screen.findByRole('heading', { level: 1, name: 'Notifications' }, { timeout: 5000 })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /unread/i })).toHaveAttribute('aria-selected', 'true')
    expect(await screen.findByText('New complaint')).toBeInTheDocument()
    expect(listRequests.some((u) => u.searchParams.get('unreadOnly') === 'true')).toBe(true)
  })
})
