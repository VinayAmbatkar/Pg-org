// VITE_API_URL is the pg-backend *origin* (no path). It's baked in at build time and is public —
// never put secrets in VITE_* variables. Production builds must point at an https origin (see
// docs/deployment.md); a trailing slash is tolerated.
const apiOrigin = (import.meta.env.VITE_API_URL ?? 'http://localhost:3000').replace(/\/+$/, '')

export const env = {
  apiOrigin,
  // pg-backend mounts every route behind a global prefix (see main.ts `setGlobalPrefix('api/v1')`).
  apiUrl: `${apiOrigin}/api/v1`,
}
