// Access token lives in memory only (cleared on reload) — refresh token is the only
// thing persisted, in localStorage, so a page reload doesn't force a full re-login.
// Never log either value.

export const REFRESH_TOKEN_KEY = 'pgmet.refreshToken'
/** Id of the user the stored refresh token belongs to (not a secret). Lets other tabs detect a
 * logout or an account switch — see AuthProvider's storage listener. */
export const SESSION_USER_KEY = 'pgmet.sessionUser'
const REFRESH_LOCK = 'pgmet.auth.refresh'

let accessToken: string | null = null

function write(key: string, value: string | null) {
  try {
    if (value) localStorage.setItem(key, value)
    else localStorage.removeItem(key)
  } catch {
    // localStorage unavailable (private mode, etc.) — session just won't survive a reload.
  }
}

export const tokenStorage = {
  getAccessToken(): string | null {
    return accessToken
  },
  setAccessToken(token: string | null) {
    accessToken = token
  },
  getRefreshToken(): string | null {
    try {
      return localStorage.getItem(REFRESH_TOKEN_KEY)
    } catch {
      return null
    }
  },
  setRefreshToken(token: string | null) {
    write(REFRESH_TOKEN_KEY, token)
  },
  setSessionUserId(userId: string | null) {
    write(SESSION_USER_KEY, userId)
  },
  clear() {
    accessToken = null
    this.setRefreshToken(null)
    this.setSessionUserId(null)
  },
}

/** Serializes token refreshes across *all tabs* of this origin. pg-backend rotates the refresh
 * token on every use and treats a second use of the same token as theft (revoking every session
 * of the user), so two tabs refreshing at once — e.g. a browser restoring several PGMet tabs —
 * would log the user out everywhere. Callers must read the refresh token *inside* `fn`, so each
 * queued refresh uses the token the previous one just rotated in. Falls back to running directly
 * where the Web Locks API is unavailable (in-tab single-flight still applies). */
export function withRefreshLock<T>(fn: () => Promise<T>): Promise<T> {
  const locks = typeof navigator !== 'undefined' ? navigator.locks : undefined
  if (!locks?.request) return fn()
  return locks.request(REFRESH_LOCK, fn) as Promise<T>
}
