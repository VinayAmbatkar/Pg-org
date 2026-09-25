# Session Management

This is the short operational reference for "how does a session survive a reload." For the full
architecture, token storage rationale, and the StrictMode bug this phase fixed, see
`docs/authentication.md` — this file exists as the standalone deliverable the phase brief asks
for, but deliberately doesn't repeat that detail.

## The three states

`AuthProvider` (`src/infrastructure/auth/AuthProvider.tsx`) exposes exactly one of:

```text
restoring        — bootstrap in progress; RequireAuth shows a spinner, nothing else renders
authenticated     — user + organizations loaded
unauthenticated   — no valid session; RequireAuth redirects to /login
```

`RequireAuth` (`src/app/guards/RequireAuth.tsx`) is the single gate all `/app/*` and
`/onboarding/*` routes sit behind. It never renders a protected page, and never renders `/login`,
while `status === 'restoring'` — this is what prevents the login-screen flicker the phase brief
calls out.

## What survives a reload, and why

| Storage           | Contents        | Survives reload? | Survives closing the tab? |
| ------------------ | ---------------- | ------------------ | ---------------------------|
| In-memory (JS var) | access token     | No                  | No                          |
| `localStorage`     | refresh token    | Yes                 | Yes (until it's revoked, expires, or a reuse/rotation invalidates it) |

A reload always costs one `POST /auth/refresh` round-trip (there's no way to skip it — the access
token is intentionally never persisted). That round-trip is what `restoring` covers.

## Session-ends-for-real triggers

- Explicit logout (`AuthProvider.logout`).
- A refresh call that gets a definitive rejection from the server (invalid/expired/already-rotated
  token) — clears `localStorage` and redirects to `/login`.
- The backend's reuse-detection firing server-side (a stolen or replayed refresh token) — this
  revokes every session for that user; the next refresh attempt from any of the user's devices
  gets the same "invalid" treatment above.

- Logging out in **another tab** of the same browser (Phase 3): the `storage` event ends this
  tab's session too. Signing in as a *different* user in another tab reloads this one.

## What does NOT end a session

- A page refresh, a component remount, a Zustand store reset, or React StrictMode's dev-only
  double-effect-invocation — see `docs/authentication.md`'s StrictMode section for exactly why
  these are safe.
- A network-level failure during the bootstrap refresh (offline, timeout, backend unreachable) —
  the stored refresh token is left untouched specifically so a later reload can still recover the
  session once connectivity returns.
- Several tabs refreshing at once (Phase 3). Refreshes are serialized across tabs with a Web Lock
  and each reads the latest rotated token, so pg-backend's reuse detection is never tripped by
  normal multi-tab use. See `docs/authentication.md` → "Phase 3: multi-tab safety".
