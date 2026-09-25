import { useQueryClient } from '@tanstack/react-query'
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { authApi } from '@/features/auth/api/authApi'
import type { LoginPayload, RegisterPayload } from '@/features/auth/types'
import { organizationKeys } from '@/features/organizations/api/queryKeys'
import { organizationsApi } from '@/features/organizations/api/organizationsApi'
import type { Organization, User } from '@/types/api'
import { registerSessionExpiredHandler } from '@/infrastructure/api/client'
import { ApiError } from '@/infrastructure/api/errors'
import { REFRESH_TOKEN_KEY, SESSION_USER_KEY, tokenStorage, withRefreshLock } from './tokenStorage'

type SessionStatus = 'restoring' | 'authenticated' | 'unauthenticated'

interface AuthContextValue {
  status: SessionStatus
  user: User | null
  organizations: Organization[]
  login: (payload: LoginPayload) => Promise<void>
  register: (payload: RegisterPayload) => Promise<void>
  logout: () => Promise<void>
  refetchOrganizations: () => Promise<Organization[]>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  const [status, setStatus] = useState<SessionStatus>('restoring')
  const [user, setUser] = useState<User | null>(null)
  const [organizations, setOrganizations] = useState<Organization[]>([])

  const loadOrganizations = useCallback(async () => {
    // Always hits the network (never `fetchQuery`, which would happily return the
    // still-fresh-by-staleTime empty list cached right after registration, silently
    // hiding an org that was just created a few seconds later during onboarding).
    const orgs = await organizationsApi.list()
    queryClient.setQueryData(organizationKeys.lists(), orgs)
    setOrganizations(orgs)
    return orgs
  }, [queryClient])

  const establishSession = useCallback(
    async (nextUser: User) => {
      tokenStorage.setSessionUserId(nextUser.id)
      setUser(nextUser)
      await loadOrganizations()
      setStatus('authenticated')
    },
    [loadOrganizations],
  )

  // Tracks whether AuthProvider is still mounted, independent of the start-once guard below — see
  // that guard's comment for why the two must be separate.
  const mountedRef = useRef(true)
  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

  // Guards against React 18 StrictMode's dev-only double-invoke of this effect (mount → cleanup →
  // remount, all synchronously within the same commit). Refresh tokens are single-use/rotated
  // server-side (see pg-backend AuthService.refresh), so firing `restore()` twice off one mount
  // races two calls against the SAME stored refresh token: one wins and rotates it, the other gets
  // a 401 "already used", logging the user straight back out. `hasStartedRef` ensures the network
  // calls only ever fire once per mount.
  //
  // This intentionally does NOT reuse a `cancelled` flag closed over per-invocation and flipped in
  // that invocation's own cleanup — StrictMode calls that cleanup synchronously right after the
  // first commit, long before `restore()`'s awaited promises settle, which would mark the one
  // execution we deliberately kept as cancelled and silently drop its result. `mountedRef` (above)
  // is set back to `true` by the second/final effect run before any promise resolves, so checking
  // it instead reflects real unmount, not StrictMode's synthetic one.
  const hasStartedRef = useRef(false)

  useEffect(() => {
    if (hasStartedRef.current) return
    hasStartedRef.current = true

    async function restore() {
      if (!tokenStorage.getRefreshToken()) {
        setStatus('unauthenticated')
        return
      }

      try {
        // Inside the cross-tab refresh lock, re-reading the token there: another tab may have
        // rotated it while we waited (see withRefreshLock).
        const refreshed = await withRefreshLock(async () => {
          const refreshToken = tokenStorage.getRefreshToken()
          if (!refreshToken) return false
          const tokens = await authApi.refresh(refreshToken)
          tokenStorage.setAccessToken(tokens.accessToken)
          tokenStorage.setRefreshToken(tokens.refreshToken)
          return true
        })
        if (!refreshed) {
          if (mountedRef.current) setStatus('unauthenticated')
          return
        }
        const me = await authApi.me()
        if (!mountedRef.current) return
        await establishSession(me)
      } catch (error) {
        if (!mountedRef.current) return
        // A stale/invalid/revoked refresh token is a genuine invalid session — clear it and send
        // the user to login. A network-level failure (offline, timeout, backend unreachable) is
        // NOT proof the session is invalid, so it must not wipe a still-good refresh token: leave
        // storage untouched and let the user retry (e.g. next reload, or when connectivity returns).
        if (error instanceof ApiError && error.kind === 'network') {
          setStatus('unauthenticated')
          return
        }
        tokenStorage.clear()
        setStatus('unauthenticated')
      }
    }

    void restore()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Cross-tab session sync. Another tab logging out removes the refresh token → end this tab's
  // session too (no API call; that tab already revoked it). Another tab signing in as a *different*
  // user changes the session owner → reload so this tab can't keep showing user A's data while
  // silently using user B's tokens. Plain token rotation by another tab changes neither.
  // Subscribed once and reading refs: a listener that closed over `status` would be stale in the
  // window between a state commit and the effect re-subscribing, and silently miss the event.
  const statusRef = useRef(status)
  const userRef = useRef(user)
  useEffect(() => {
    statusRef.current = status
    userRef.current = user
  })

  useEffect(() => {
    function handleStorage(event: StorageEvent) {
      if (event.key === REFRESH_TOKEN_KEY && event.newValue === null && statusRef.current !== 'unauthenticated') {
        tokenStorage.setAccessToken(null)
        setUser(null)
        setOrganizations([])
        setStatus('unauthenticated')
        queryClient.clear()
      } else if (event.key === SESSION_USER_KEY && event.newValue && userRef.current && event.newValue !== userRef.current.id) {
        window.location.reload()
      }
    }
    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [queryClient])

  useEffect(() => {
    registerSessionExpiredHandler(() => {
      setUser(null)
      setOrganizations([])
      setStatus('unauthenticated')
      queryClient.clear()
    })
  }, [queryClient])

  const login = useCallback(
    async (payload: LoginPayload) => {
      const { user: loggedInUser, tokens } = await authApi.login(payload)
      tokenStorage.setAccessToken(tokens.accessToken)
      tokenStorage.setRefreshToken(tokens.refreshToken)
      await establishSession(loggedInUser)
    },
    [establishSession],
  )

  const register = useCallback(
    async (payload: RegisterPayload) => {
      const { user: registeredUser, tokens } = await authApi.register(payload)
      tokenStorage.setAccessToken(tokens.accessToken)
      tokenStorage.setRefreshToken(tokens.refreshToken)
      await establishSession(registeredUser)
    },
    [establishSession],
  )

  const logout = useCallback(async () => {
    const refreshToken = tokenStorage.getRefreshToken()
    tokenStorage.clear()
    setUser(null)
    setOrganizations([])
    setStatus('unauthenticated')
    queryClient.clear()
    if (refreshToken) {
      try {
        await authApi.logout(refreshToken)
      } catch {
        // Best-effort — client-side state is already cleared regardless.
      }
    }
  }, [queryClient])

  const value = useMemo<AuthContextValue>(
    () => ({ status, user, organizations, login, register, logout, refetchOrganizations: loadOrganizations }),
    [status, user, organizations, login, register, logout, loadOrganizations],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider')
  return ctx
}
