/** Returns the URL value only if it's one of the allowed enum members. A stale bookmark or a
 * hand-edited `?status=FOO` must be ignored, not forwarded — pg-backend rejects unknown enum
 * values (and unknown params) with 400, which would turn a bad URL into an error page. */
export function parseEnumParam<T extends string>(value: string | null | undefined, allowed: readonly T[]): T | undefined {
  return value && (allowed as readonly string[]).includes(value) ? (value as T) : undefined
}

/** Positive integer page from the URL, defaulting to 1. */
export function parsePageParam(value: string | null | undefined): number {
  const page = Number(value)
  return Number.isInteger(page) && page > 0 ? page : 1
}

/** Client-side pagination for endpoints that return the full list (invoices, residencies). */
export function paginate<T>(items: T[], page: number, limit: number): { items: T[]; page: number; total: number } {
  const totalPages = Math.max(1, Math.ceil(items.length / limit))
  const safePage = Math.min(page, totalPages)
  return { items: items.slice((safePage - 1) * limit, safePage * limit), page: safePage, total: items.length }
}
