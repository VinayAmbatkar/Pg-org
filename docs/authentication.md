# Authentication

Verified directly against `pg-backend`'s `src/modules/auth` controller/DTOs/JWT strategy.

## Endpoints consumed

| Method | Path            | Notes                                                              |
| ------ | --------------- | ------------------------------------------------------------------- |
| POST   | `/auth/register`| `{name, email?, phone?, password}` → `{user, tokens}` (tokens issued immediately) |
| POST   | `/auth/login`   | `{identifier, password}` → `{user, tokens}`                        |
| POST   | `/auth/refresh` | `{refreshToken}` → new `{accessToken, refreshToken, expiresIn, tokenType}` (rotation) |
| POST   | `/auth/logout`  | `{refreshToken}` → `{message}`                                     |
| GET    | `/auth/me`      | Bearer → `{id, name, email, phone, status, platformRole}`          |

## Token handling

- Tokens travel only in the JSON response body — the backend never sets cookies.
- The **access token lives in memory only** (`src/infrastructure/auth/tokenStorage.ts`), lost on
  reload by design.
- The **refresh token is the only thing persisted**, in `localStorage`, so a reload doesn't force
  a full re-login. Neither token is ever logged.
- On app load, `AuthProvider` (`src/infrastructure/auth/AuthProvider.tsx`) calls
  `POST /auth/refresh` with the stored refresh token, then `GET /auth/me`, to restore the session.
  If there's no stored refresh token, or refresh fails, the user lands on `/login`.
- The JWT payload is `{sub: userId}` only — no role or org claims. Role is discovered separately
  via `GET /organizations` (see `docs/authorization.md`).

## Request/refresh flow

`src/infrastructure/api/client.ts`:

1. A request interceptor attaches `Authorization: Bearer <accessToken>` (skipped for the
   auth endpoints themselves).
2. A response interceptor catches `401`s, and deduplicates concurrent refresh attempts behind a
   single shared promise — every 401 that arrives while a refresh is already in flight awaits
   that same promise instead of firing its own `/auth/refresh` call.
3. On successful refresh, the original request is retried once with the new access token.
4. On refresh failure, local session state is cleared and
   `registerSessionExpiredHandler` (wired up by `AuthProvider`) fires, redirecting to `/login`.

Refresh tokens are single-use (rotation) — a reused refresh token revokes **all** sessions for
that user server-side, so the frontend always overwrites its stored refresh token immediately
after every refresh/login/register response.

## Session bootstrap (reload/close-reopen) and the StrictMode pitfall

`AuthProvider` exposes three states — `restoring`, `authenticated`, `unauthenticated` — and
`RequireAuth` (`src/app/guards/RequireAuth.tsx`) blocks on `restoring` with a spinner rather than
ever rendering `/login` or a protected page before bootstrap resolves. This is what makes a normal
reload (or reopening the tab, while the stored refresh token is still valid) restore the session
instead of bouncing the user to login.

Because refresh tokens are single-use, the bootstrap effect must call `POST /auth/refresh` with the
stored token **exactly once** per app load. React 18 `StrictMode` (enabled in `src/main.tsx`)
double-invokes effects in development — mount → cleanup → remount, all synchronously in the same
commit, before any awaited promise settles. A naive `useEffect` guarded only by a
per-invocation `cancelled` flag breaks under this: StrictMode's synthetic cleanup for the *first*
invocation fires before `restore()`'s `await`s resolve, marking the one execution that's actually
doing useful work as cancelled and silently dropping its result — which manifested as "login, then
refresh the browser, and you're logged out," even though the stored refresh token was perfectly
valid.

The fix (`src/infrastructure/auth/AuthProvider.tsx`) uses two separate refs instead of one:

- `hasStartedRef` — set on the *first* effect invocation, so the redundant StrictMode remount never
  fires a second `/auth/refresh` call.
- `mountedRef` — set `true`/`false` by a dedicated `useEffect(() => {...}, [])`, which itself gets
  the same double-invoke treatment and so is back to `true` before any awaited promise in
  `restore()` resolves. This is what `restore()` checks before calling `setState`, instead of the
  old per-invocation `cancelled` flag.

On genuine refresh failure, the bootstrap effect (and the runtime 401 → refresh interceptor in
`src/infrastructure/api/client.ts`) also distinguish *why* the refresh call failed:

- **No HTTP response at all** (`ApiError.kind === 'network'` / an Axios error with no
  `error.response`) — offline, timeout, backend unreachable. This is not proof the session is
  invalid, so the stored refresh token is left untouched. The UI still shows `unauthenticated` for
  that attempt (there's no access token to proceed with), but a later reload — once connectivity
  returns — can still restore the session from the surviving refresh token.
- **A definitive rejection from the server** (401/403 — invalid, expired, or already-rotated/reused
  token) — this is a genuinely invalid session: `tokenStorage.clear()` runs and the user is sent to
  `/login`.

Regression coverage: `src/infrastructure/auth/AuthProvider.test.tsx` (bootstrap restoration,
invalid-refresh-token clears session, network-failure-preserves-token, and a dedicated StrictMode
double-invoke test using a single-use-token MSW handler that mirrors the backend's rotation
semantics) and `src/infrastructure/api/client.test.ts` (401 → refresh → retry, concurrent 401s
deduplicated into one refresh call, invalid refresh clears session, network failure during refresh
does not clear a valid refresh token).

## Phase 3: multi-tab safety

pg-backend rotates the refresh token on every use and treats a *second* use of the same token as
theft: it revokes **every** session of that user (`TOKEN_REVOKED`). The per-tab single-flight
promise above can't see other tabs, so two tabs refreshing at the same moment — most commonly a
browser restoring several PGMet tabs, which all bootstrap at once — would send the same token twice
and log the user out everywhere.

- **Cross-tab refresh lock.** Every refresh (the 401 interceptor *and* the bootstrap in
  `AuthProvider`) runs inside `withRefreshLock` (`tokenStorage.ts`), a Web Locks API lock shared by
  all tabs of the origin. The refresh token is read **inside** the lock, so a queued tab uses the
  token the previous holder just rotated in. Where `navigator.locks` is unavailable it degrades to
  the per-tab behaviour. Covered by `src/infrastructure/auth/crossTab.test.tsx` and E2E test 1
  (which fails if the mock backend ever sees a reused token).
- **Cross-tab session sync.** `AuthProvider` listens for `storage` events:
  - refresh token removed (another tab logged out) → this tab ends its session locally, no API call;
  - `pgmet.sessionUser` changed to a *different* user id (another tab signed in as someone else) →
    this tab reloads, so it can't keep showing user A's cached data while using user B's tokens.
  Plain rotation by another tab changes neither key's meaning and is ignored.
- **Post-login redirect** returns to the page that bounced the user to `/login`, path *and* query
  (so `?status=OVERDUE` survives), but only for in-app `/app/…` paths — anything else (absolute or
  protocol-relative `//host`) falls back to the dashboard. No open redirect.
