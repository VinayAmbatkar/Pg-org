import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios'
import { env } from '@/app/config/env'
import { tokenStorage, withRefreshLock } from '@/infrastructure/auth/tokenStorage'
import type { AuthTokens } from '@/types/api'
import { normalizeError } from './errors'
import type { SuccessEnvelope } from './envelope'

declare module 'axios' {
  interface InternalAxiosRequestConfig {
    _retry?: boolean
    _skipAuthRefresh?: boolean
  }
}

/** Invoked once when a refresh attempt fails — lets the auth layer clear state and redirect without this module importing React. */
let onSessionExpired: (() => void) | null = null
export function registerSessionExpiredHandler(handler: () => void) {
  onSessionExpired = handler
}

export const apiClient = axios.create({
  baseURL: env.apiUrl,
  timeout: 15000,
})

const AUTH_ENDPOINTS = ['/auth/login', '/auth/register', '/auth/refresh', '/auth/logout']

apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = tokenStorage.getAccessToken()
  const isAuthEndpoint = AUTH_ENDPOINTS.some((path) => config.url?.includes(path))
  if (token && !isAuthEndpoint) {
    config.headers.set('Authorization', `Bearer ${token}`)
  }
  return config
})

// Deduplicates concurrent refresh attempts: every 401 that arrives while a refresh
// is already in flight awaits the same promise instead of firing its own /auth/refresh call.
let refreshPromise: Promise<RefreshResult> | null = null

type RefreshResult = { accessToken: string } | { invalidSession: true } | { networkFailure: true }

function refreshAccessToken(): Promise<RefreshResult> {
  // Cross-tab lock + read-inside-lock: see withRefreshLock for why (rotating tokens + reuse detection).
  return withRefreshLock(refreshWithStoredToken)
}

async function refreshWithStoredToken(): Promise<RefreshResult> {
  const refreshToken = tokenStorage.getRefreshToken()
  if (!refreshToken) return { invalidSession: true }

  try {
    const response = await axios.post<SuccessEnvelope<AuthTokens>>(
      `${env.apiUrl}/auth/refresh`,
      { refreshToken },
      { timeout: 15000 },
    )
    const tokens = response.data.data
    tokenStorage.setAccessToken(tokens.accessToken)
    tokenStorage.setRefreshToken(tokens.refreshToken)
    return { accessToken: tokens.accessToken }
  } catch (error) {
    // No response at all (offline, timeout, backend unreachable) is a temporary failure, not proof
    // the refresh token is invalid — the stored refresh token must survive it so a later request
    // can retry instead of forcing a re-login. Only a definitive rejection *from the server*
    // (401/403 — invalid, expired, or reused/revoked token) means the session itself is gone.
    if (axios.isAxiosError(error) && !error.response) {
      return { networkFailure: true }
    }
    return { invalidSession: true }
  }
}

apiClient.interceptors.response.use(
  (response) => {
    // Unwrap the backend's `{success, data, requestId}` envelope so every feature's
    // `api/*.ts` module can treat `response.data` as the DTO directly.
    const body = response.data as SuccessEnvelope<unknown> | unknown
    if (body && typeof body === 'object' && 'success' in body && (body as SuccessEnvelope<unknown>).success) {
      response.data = (body as SuccessEnvelope<unknown>).data
    }
    return response
  },
  async (error: AxiosError) => {
    const config = error.config as InternalAxiosRequestConfig | undefined
    const status = error.response?.status
    const isAuthEndpoint = AUTH_ENDPOINTS.some((path) => config?.url?.includes(path))

    if (status === 401 && config && !config._retry && !isAuthEndpoint) {
      config._retry = true

      refreshPromise ??= refreshAccessToken().finally(() => {
        refreshPromise = null
      })
      const result = await refreshPromise

      if ('accessToken' in result) {
        config.headers.set('Authorization', `Bearer ${result.accessToken}`)
        return apiClient.request(config)
      }

      if ('invalidSession' in result) {
        tokenStorage.clear()
        onSessionExpired?.()
      }
      // networkFailure: leave the stored refresh token untouched and just fail this request —
      // the session is still potentially valid and a subsequent request/reload can retry it.
    }

    return Promise.reject(normalizeError(error))
  },
)
