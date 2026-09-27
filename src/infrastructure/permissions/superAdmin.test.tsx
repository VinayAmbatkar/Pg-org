import { screen, within } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { env } from '@/app/config/env'
import { APP_PATHS } from '@/app/router/paths'
import { tokenStorage } from '@/infrastructure/auth/tokenStorage'
import { testOrganization, testUser } from '@/test/handlers'
import { renderApp, resetUiStore } from '@/test/renderApp'
import { server } from '@/test/server'
import { effectiveRole, hasPermission } from './permissions'

describe('effectiveRole', () => {
  it('uses the real membership role when there is one', () => {
    expect(effectiveRole('STAFF', 'SUPER_ADMIN')).toBe('STAFF')
    expect(effectiveRole('MANAGER', 'USER')).toBe('MANAGER')
  })

  it('treats a platform SUPER_ADMIN without a membership as OWNER (the backend bypasses role checks)', () => {
    expect(effectiveRole(null, 'SUPER_ADMIN')).toBe('OWNER')
    expect(hasPermission(effectiveRole(null, 'SUPER_ADMIN'), 'properties.archive')).toBe(true)
  })

  it('gives an ordinary user without a membership no role', () => {
    expect(effectiveRole(null, 'USER')).toBeNull()
    expect(effectiveRole(undefined, undefined)).toBeNull()
  })
})

describe('Owner Web for a platform SUPER_ADMIN', () => {
  beforeEach(() => {
    resetUiStore()
    tokenStorage.setRefreshToken('valid-refresh-token')
    // Exactly what pg-backend returns for a super admin: every org, with yourRole null.
    server.use(
      http.get(`${env.apiUrl}/auth/me`, () =>
        HttpResponse.json({ success: true, data: { ...testUser, name: 'Super Admin', platformRole: 'SUPER_ADMIN' }, requestId: 't' }),
      ),
      http.get(`${env.apiUrl}/organizations`, () =>
        HttpResponse.json({ success: true, data: [{ ...testOrganization, yourRole: null }], requestId: 't' }),
      ),
    )
  })
  afterEach(() => tokenStorage.clear())

  it('opens the dashboard instead of "no access", with the full navigation', async () => {
    renderApp(APP_PATHS.dashboard)
    expect(await screen.findByRole('heading', { level: 1, name: /good (morning|afternoon|evening), super/i })).toBeInTheDocument()
    expect(screen.queryByText("You don't have access to this page")).not.toBeInTheDocument()
    const nav = screen.getByRole('navigation', { name: 'Primary' })
    for (const label of ['Properties', 'Rooms & Beds', 'Billing', 'Settings']) {
      expect(within(nav).getByRole('link', { name: label })).toBeInTheDocument()
    }
  })

  it('labels the account as Super Admin rather than Member', async () => {
    renderApp(APP_PATHS.dashboard)
    expect(await screen.findByText('Super Admin', { selector: 'p, span, div' })).toBeInTheDocument()
    expect(screen.queryByText('Member')).not.toBeInTheDocument()
  })
})
