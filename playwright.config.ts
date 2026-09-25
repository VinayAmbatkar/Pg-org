import { defineConfig, devices } from '@playwright/test'
import { E2E_API_ORIGIN } from './e2e/support/mockBackend'

// E2E runs against the *production build* (vite build + vite preview), never the dev server and
// never a real backend: every /api/v1 call is served by the deterministic in-memory mock in
// e2e/support/mockBackend.ts via page routing. The API origin below doesn't exist on the network,
// so an unmocked request fails loudly instead of silently hitting a real environment.
const PORT = 4173

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  // All workers start at once against a just-booted preview server; the first lazy chunk loads can
  // exceed Playwright's 5s default under that load.
  expect: { timeout: 10_000 },
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    // Responsive widths (1440/1280/1024/768) are covered inside the @responsive test itself.
    { name: 'chromium', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } } },
  ],
  webServer: {
    // Separate outDir so an E2E run never overwrites a real production build in dist/.
    command: `npx vite build --outDir dist-e2e && npx vite preview --outDir dist-e2e --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
    env: { VITE_API_URL: E2E_API_ORIGIN },
  },
})
