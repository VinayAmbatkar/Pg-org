import { act, renderHook } from '@testing-library/react'
import { useEffect, type ReactNode } from 'react'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { useUrlParams } from './useUrlState'

function setup(initial = '/rooms') {
  const ref: { current: ReturnType<typeof useUrlParams> | null } = { current: null }
  function Probe() {
    const api = useUrlParams()
    useEffect(() => {
      ref.current = api
    })
    return null
  }
  const router = createMemoryRouter([{ path: '/rooms', element: <Probe /> }], { initialEntries: [initial] })
  renderHook(() => null, { wrapper: ({ children }: { children: ReactNode }) => <><RouterProvider router={router} />{children}</> })
  return { router, get hook() { return ref.current! } }
}

describe('useUrlParams', () => {
  it('keeps both of two updates made before a re-render (React Router does not queue them)', () => {
    const t = setup()
    const set = t.hook.set
    act(() => {
      set({ roomType: 'SINGLE' })
      set({ room: '20' }, { replace: true })
    })
    expect(t.router.state.location.search).toBe('?roomType=SINGLE&room=20')
  })

  it('removes empty values and pushes history unless replace is requested', () => {
    const t = setup('/rooms?floor=2&view=list')
    act(() => t.hook.set({ floor: null, amen: 'AC' }))
    expect(t.router.state.location.search).toBe('?view=list&amen=AC')
    act(() => void t.router.navigate(-1))
    expect(t.router.state.location.search).toBe('?floor=2&view=list')
  })
})
