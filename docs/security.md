# Frontend security review (Phase 3)

Scope: `src/` and the production bundle, reviewed 2026-09-25. The frontend is not a security
boundary: pg-backend authorizes every request (403 for insufficient role, 404 outside your org).
The goal here is not leaking, not being an XSS/redirect vector, and not assuming authorization.

## Findings and fixes

| Area | Finding | Status |
| --- | --- | --- |
| Session | **Multi-tab refresh race.** Two tabs refreshing at once reused a single-use refresh token, and pg-backend's reuse detection revokes *all* sessions (forced logout everywhere). | **Fixed:** cross-tab Web Lock around every refresh, token read inside the lock (`withRefreshLock`). Tested in unit + E2E |
| Session | Logout in one tab left other tabs operating; signing in as another user in a second tab let an old tab continue on the new user's tokens with the previous user's cached data. | **Fixed:** `storage` listener ends the session / reloads (`AuthProvider`) |
| Redirects | Post-login redirect used router state only (not attacker-controlled) but dropped the query string. | **Hardened:** in-app `/app/…` paths only (never absolute or `//host`), query preserved |
| URL params | Enum params from the URL were forwarded to the API unvalidated. | **Fixed:** `parseEnumParam` allow-lists every filter |
| Deep links | Notification metadata ids were interpolated into paths unchecked. | **Fixed:** strict UUID check; `../`, `?`, partial ids and `javascript:` rejected (tested) |
| XSS | No `dangerouslySetInnerHTML`, `innerHTML`, `eval` or `new Function` anywhere in `src/`. User content renders as text. Complaint attachment links are scheme-checked (`isSafeHttpUrl`, http/https only) and open with `rel="noopener noreferrer"`. | OK |
| Logging | No `console.*` in production paths. Error boundaries log only under `import.meta.env.DEV`. Tokens are never logged. | OK |
| Errors | 5xx / unknown backend text is never shown (tested: a Prisma message doesn't reach the UI). 400 and domain-409 messages are human-authored by the backend and shown. | OK |
| Secrets | Bundle scanned for key/secret patterns: none. `VITE_*` holds only the public API origin. `.env*` is git-ignored except `.env.example`. No source maps shipped. | OK |
| Query strings | Only filters, search terms, tabs and pages. No tokens, ids of other users, or PII in URLs (refresh token travels in the request body). | OK |
| Authorization | Permission checks are UX only (`permissions.md`). Route guards stop a direct URL from rendering a module the role lacks. Every action is still enforced server-side. | OK |

## Accepted risk: refresh token in `localStorage`

pg-backend takes the refresh token in the JSON body and never sets cookies, so it must be
JS-readable (`docs/backend-gaps.md` §21). XSS would therefore expose it. Mitigations in place: no
HTML injection sinks, scheme-checked external links, access token held in memory only, and
single-use rotation with server-side reuse detection. **Deployment must add a strict CSP**
(`docs/deployment.md`). The proper fix is an httpOnly refresh cookie on the backend.

## Checklist for new code

- Never render user or backend strings as HTML. Validate any URL before using it as `href`/`src`.
- Build internal links only from validated ids (see `resolveNotificationLink`).
- Never forward raw URL params to the API; allow-list them.
- Don't add `console.*` outside `import.meta.env.DEV` guards, and never log tokens or request bodies.
- Hiding a button is not authorization. Assume the backend decides.
