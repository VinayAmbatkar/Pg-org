import { useCallback, useLayoutEffect, useMemo, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'

type ParamUpdates = Record<string, string | number | null | undefined>

interface SetOptions {
  /** Replace the current history entry instead of pushing one. Use for keystroke-level changes
   * (search-as-you-type) so Back isn't flooded; leave false for filters/pages/tabs so Back/Forward
   * step through them naturally. */
  replace?: boolean
}

/** Reads/writes several query-string params atomically. Setting a key to '', null or undefined
 * removes it, keeping URLs short and shareable. */
export function useUrlParams() {
  const [searchParams, setSearchParams] = useSearchParams()
  // React Router doesn't queue functional setSearchParams updates: `prev` is the params as of the
  // last render, so two updates in quick succession (a filter click + a debounced search commit)
  // would make the second silently drop the first. Chain every update through this ref instead,
  // re-syncing from the router whenever it commits new params.
  const latest = useRef(searchParams)
  useLayoutEffect(() => {
    latest.current = searchParams
  }, [searchParams])

  const get = useCallback((key: string, defaultValue = '') => searchParams.get(key) ?? defaultValue, [searchParams])

  const set = useCallback(
    (updates: ParamUpdates, { replace = false }: SetOptions = {}) => {
      const params = new URLSearchParams(latest.current)
      for (const [key, value] of Object.entries(updates)) {
        if (value === null || value === undefined || value === '') params.delete(key)
        else params.set(key, String(value))
      }
      latest.current = params
      setSearchParams(params, { replace })
    },
    [setSearchParams],
  )

  return { searchParams, get, set }
}

/** Reads/writes a single query-string param, so page/search/filter state survives a refresh
 * and is shareable via URL, per the app's URL-state convention. The default value is never
 * written to the URL. */
export function useUrlState(key: string, defaultValue = '', options: SetOptions = {}) {
  const { searchParams, set } = useUrlParams()
  const value = useMemo(() => searchParams.get(key) ?? defaultValue, [searchParams, key, defaultValue])
  const { replace = false } = options

  const setValue = useCallback(
    (next: string) => set({ [key]: next === defaultValue ? null : next }, { replace }),
    [key, defaultValue, set, replace],
  )

  return [value, setValue] as const
}
