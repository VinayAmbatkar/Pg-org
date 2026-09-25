import { IDS } from './support/mockBackend'
import { expect, login, sidebar, test } from './support/fixtures'

// Production-critical Owner Web flows, against the production build and the deterministic mock
// backend (see playwright.config.ts). Each test starts from a fresh browser context.

test('1 · authentication: login → dashboard → refresh → still authenticated', async ({ page, backend }) => {
  await login(page)
  await page.reload()
  await expect(page).toHaveURL(/\/app\/dashboard$/)
  await expect(page.getByRole('heading', { level: 1, name: /asha/i })).toBeVisible()
  // One rotation per page load: no duplicate/concurrent refresh with the same token.
  expect(backend.calls.filter((c) => c === 'POST /auth/refresh')).toHaveLength(1)
})

test('2 · rooms & beds (P0): sidebar → page opens → refresh → still accessible', async ({ page }) => {
  await login(page)
  await sidebar(page).getByRole('link', { name: 'Rooms & Beds' }).click()
  await expect(page).toHaveURL(/\/app\/rooms$/)
  await expect(page.getByRole('heading', { level: 1, name: 'Rooms & Beds' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Room 204' })).toBeVisible()
  await expect(sidebar(page).getByRole('link', { name: 'Rooms & Beds' })).toHaveAttribute('aria-current', 'page')

  await page.reload()
  await expect(page).toHaveURL(/\/app\/rooms$/)
  await expect(page.getByRole('heading', { level: 1, name: 'Rooms & Beds' })).toBeVisible()
  await expect(page.getByText('1 bed available')).toBeVisible()
  await expect(page).toHaveTitle('Rooms & Beds · PGMet')
})

test('3 · property: dashboard → properties → property 360 → rooms & beds tab', async ({ page }) => {
  await login(page)
  await sidebar(page).getByRole('link', { name: 'Properties' }).click()
  await page.getByRole('row', { name: /sunrise pg/i }).click()
  await expect(page).toHaveURL(new RegExp(`/app/properties/${IDS.property}$`))
  await expect(page.getByRole('heading', { level: 1, name: 'Sunrise PG' })).toBeVisible()
  await expect(page.getByRole('region', { name: 'Property health' })).toContainText('50%')

  await page.getByRole('tab', { name: 'Rooms & Beds' }).click()
  await expect(page).toHaveURL(/tab=rooms/)
  await expect(page.getByRole('tabpanel')).toContainText('Room 204')
})

test('4 · tenant: tenants → tenant 360 → residency', async ({ page }) => {
  await login(page)
  await sidebar(page).getByRole('link', { name: 'Tenants' }).click()
  await page.getByRole('row', { name: /88888888/ }).click()
  await expect(page).toHaveURL(new RegExp(`/app/residencies/${IDS.residency}$`))
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Tenant 88888888')
  const panel = page.getByRole('tabpanel')
  await expect(panel.getByRole('heading', { name: 'Residency' })).toBeVisible()
  await expect(panel).toContainText('Active')
  await expect(page.getByRole('link', { name: 'Sunrise PG' })).toBeVisible()
})

test('5 · billing: overdue alert → invoices (filtered) → invoice detail', async ({ page }) => {
  await login(page)
  const alerts = page.getByRole('region', { name: 'Needs your attention' })
  await expect(alerts).toContainText('1 overdue invoice')
  await alerts.getByRole('link', { name: /view invoices/i }).click()
  await expect(page).toHaveURL(/\/app\/billing\/invoices\?status=OVERDUE$/)
  await expect(page.getByLabel('Filter by status')).toHaveValue('OVERDUE')

  await page.getByRole('row', { name: /INV-2026-000101/ }).click()
  await expect(page).toHaveURL(new RegExp(`/app/billing/invoices/${IDS.invoice}$`))
  await expect(page.getByText('INV-2026-000101').first()).toBeVisible()
})

test('6 · complaint: complaints → detail → start work', async ({ page, backend }) => {
  await login(page)
  await sidebar(page).getByRole('link', { name: 'Complaints' }).click()
  await page.getByRole('row', { name: /leaking bathroom tap/i }).click()
  await expect(page).toHaveURL(new RegExp(`/app/complaints/${IDS.complaint}$`))

  await page.getByRole('button', { name: 'Start work' }).click()
  await expect(page.getByText('In progress').first()).toBeVisible()
  expect(backend.state.complaint.status).toBe('IN_PROGRESS')
})

test('7 · application: applications → detail → review → visit → approval', async ({ page, backend }) => {
  await login(page)
  await sidebar(page).getByRole('link', { name: 'Applications' }).click()
  await page.getByRole('row', { name: /rahul sharma/i }).click()
  await expect(page).toHaveURL(new RegExp(`/app/applications/${IDS.application}$`))

  await page.getByRole('button', { name: 'Start review' }).click()
  await expect(page.getByText('Under review').first()).toBeVisible()

  await page.getByRole('button', { name: 'Schedule visit' }).click()
  const dialog = page.getByRole('dialog', { name: 'Schedule visit' })
  await dialog.getByLabel('Start time').fill('2026-12-01T10:00')
  await dialog.getByLabel('End time').fill('2026-12-01T10:30')
  await dialog.getByRole('button', { name: 'Schedule' }).click()
  await expect(dialog).toBeHidden()
  await expect(page.getByText('Visit scheduled').first()).toBeVisible()

  await page.getByRole('button', { name: 'Approve' }).click()
  await expect(page.getByText('Approved').first()).toBeVisible()
  expect(backend.state.application.status).toBe('APPROVED')
  expect(backend.state.visits).toHaveLength(1)
})

test('8 · command palette: Ctrl+K → "rooms" → Enter opens Rooms & Beds', async ({ page }) => {
  await login(page)
  await page.keyboard.press('Control+k')
  const input = page.getByRole('combobox', { name: /search pages/i })
  await expect(input).toBeFocused()
  await input.fill('rooms')
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(/\/app\/rooms$/)
})

test('9 · responsive @responsive: at 1440/1280/1024/768 the shell stays usable and nothing scrolls horizontally', async ({ page }) => {
  await login(page)
  for (const width of [1440, 1280, 1024, 768]) {
    await page.setViewportSize({ width, height: 900 })
    for (const path of ['/app/dashboard', '/app/rooms', '/app/billing/invoices', `/app/properties/${IDS.property}`]) {
      await page.goto(path)
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
      expect(overflow, `${path} scrolls horizontally at ${width}px`).toBeLessThanOrEqual(0)
    }
    // Below 1024px the sidebar is icon-only; links keep their accessible names.
    await expect(sidebar(page).getByRole('link', { name: 'Rooms & Beds' })).toBeVisible()
    await expect(page.getByRole('button', { name: /notifications/i })).toBeInViewport()
  }
})

test('10 · rooms: list view → room detail → bed layout with occupant → tenants tab', async ({ page }) => {
  await login(page)
  await page.goto('/app/rooms?view=list')
  const row = page.getByRole('row', { name: /room 204/i })
  await expect(row).toContainText('AC · Double')
  await row.getByRole('link', { name: 'Open room 204' }).click()
  await expect(page).toHaveURL(new RegExp(`/app/properties/${IDS.property}/rooms/${IDS.room}$`))
  await expect(page.getByRole('heading', { level: 1, name: 'Room 204' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Lower berth' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Rohit Sharma, open tenant' })).toBeVisible()
  await page.getByRole('tab', { name: 'Tenants (1)' }).click()
  await expect(page.getByRole('table', { name: 'Tenants in room 204' })).toContainText('9876500001')
})
