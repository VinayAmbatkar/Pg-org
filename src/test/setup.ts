import '@testing-library/jest-dom/vitest'
import { configure } from '@testing-library/react'
import { afterAll, afterEach, beforeAll } from 'vitest'
import { server } from './server'

// Page-level tests fan out many MSW requests (a dashboard is ~20); under a parallel full-suite run
// RTL's default 1s findBy/waitFor timeout is too tight and causes load-dependent flakes.
configure({ asyncUtilTimeout: 4000 })

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())
