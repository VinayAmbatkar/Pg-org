import { test as base, expect, type Page } from '@playwright/test'
import { installMockBackend, type MockBackend } from './mockBackend'

export const test = base.extend<{ backend: MockBackend }>({
  // auto: installed for every test, whether or not the test body asks for `backend`.
  backend: [async ({ context }, use) => {
    const backend = await installMockBackend(context)
    await use(backend)
    // Every call the app made must be one the mock (i.e. the verified backend contract) knows.
    expect(backend.unhandled, 'app called endpoints the backend mock does not implement').toEqual([])
    // The session must never trip pg-backend's refresh-token reuse detection.
    expect(backend.state.sessionsRevoked, 'refresh token was reused (would log the user out everywhere)').toBe(false)
  }, { auto: true }],
})

export { expect }

export async function login(page: Page) {
  await page.goto('/login')
  await page.getByLabel(/email or phone/i).fill('owner@pgmet.test')
  await page.getByLabel(/password/i).fill('correct-password')
  await page.getByRole('button', { name: /log in/i }).click()
  await expect(page).toHaveURL(/\/app\/dashboard$/)
  await expect(page.getByRole('heading', { level: 1, name: /good (morning|afternoon|evening), asha/i })).toBeVisible()
}

export function sidebar(page: Page) {
  return page.getByRole('navigation', { name: 'Primary' })
}
