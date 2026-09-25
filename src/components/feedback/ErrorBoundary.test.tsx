import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { SectionBoundary } from './ErrorBoundary'

function Bomb({ explode }: { explode: boolean }) {
  if (explode) throw new Error('chart exploded')
  return <p>chart ok</p>
}

describe('SectionBoundary', () => {
  // React logs caught render errors; keep test output clean.
  beforeEach(() => vi.spyOn(console, 'error').mockImplementation(() => {}))
  afterEach(() => vi.restoreAllMocks())

  it('contains a crashing section so its siblings keep rendering', () => {
    render(
      <>
        <SectionBoundary>
          <Bomb explode />
        </SectionBoundary>
        <p>rest of the dashboard</p>
      </>,
    )
    expect(screen.getByRole('alert')).toHaveTextContent('This section failed to display')
    expect(screen.getByText('rest of the dashboard')).toBeInTheDocument()
  })

  it('recovers via Try again once the cause is gone, and resets when its keys change', async () => {
    const user = userEvent.setup()
    const { rerender } = render(
      <SectionBoundary resetKeys={['property-a']}>
        <Bomb explode />
      </SectionBoundary>,
    )
    expect(screen.getByRole('alert')).toBeInTheDocument()

    // Switching property (new reset key) clears the error without a click.
    rerender(
      <SectionBoundary resetKeys={['property-b']}>
        <Bomb explode={false} />
      </SectionBoundary>,
    )
    expect(screen.getByText('chart ok')).toBeInTheDocument()

    rerender(
      <SectionBoundary resetKeys={['property-b']}>
        <Bomb explode />
      </SectionBoundary>,
    )
    expect(screen.getByRole('alert')).toBeInTheDocument()
    rerender(
      <SectionBoundary resetKeys={['property-b']}>
        <Bomb explode={false} />
      </SectionBoundary>,
    )
    await user.click(screen.getByRole('button', { name: /try again/i }))
    expect(screen.getByText('chart ok')).toBeInTheDocument()
  })
})
