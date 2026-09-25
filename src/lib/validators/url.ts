/** Defense-in-depth check before treating a user-supplied URL as a clickable link — rejects
 * `javascript:`/`data:`/any non-http(s) scheme, which could otherwise execute when clicked. */
export function isSafeHttpUrl(value: string): boolean {
  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}
