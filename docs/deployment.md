# Deployment

Owner Web is a static SPA: build once per environment, serve `dist/` from any static host or CDN.

## Build

```bash
npm ci
VITE_API_URL=https://api.example.com npm run build   # typecheck + vite build → dist/
```

- `VITE_API_URL` is the pg-backend **origin** (no `/api/v1`, trailing slash tolerated). It's baked
  in at build time and is public. Never put secrets in `VITE_*`.
- Production must use an **https** origin. If `VITE_API_URL` is unset the build falls back to
  `http://localhost:3000`, which is only valid for local development.
- pg-backend must allow the Owner Web origin in CORS.

## Serving

- **SPA fallback:** every unknown path must serve `index.html` (client-side routing). Examples:
  Nginx `try_files $uri /index.html;`; Netlify `/* /index.html 200`.
- **Caching:** `assets/*` filenames are content-hashed, so serve them with
  `Cache-Control: public, max-age=31536000, immutable`. Serve `index.html` with `no-cache` so a
  deploy is picked up immediately. After a deploy, a tab holding an old `index.html` may fail to
  load a removed lazy chunk; `RouteErrorBoundary` detects this and offers "Reload" to get the new
  version.
- **Security headers (required, see `docs/security.md`):**

  ```
  Content-Security-Policy: default-src 'self'; script-src 'self';
    style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com;
    img-src 'self' data: https:; connect-src 'self' https://api.example.com; frame-ancestors 'none';
    base-uri 'self'; form-action 'self'
  Strict-Transport-Security: max-age=31536000; includeSubDomains
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  ```

  `connect-src` must list the API origin. The Google Fonts hosts are for the DM Sans import in
  `src/index.css` (self-host the font to drop them). `style-src 'unsafe-inline'` is needed for small
  inline styles (chart colours, progress widths). The built `index.html` has no inline scripts, so
  `script-src 'self'` is enough.

## Release checklist

```bash
npm run typecheck && npm run lint && npm test && npm run build && npm run test:e2e
```

Then smoke-test the deployed build: log in, reload (still signed in), open Rooms & Beds from the
sidebar, open a Property 360 and a Tenant 360.
