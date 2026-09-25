import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { DataTable, type DataTableColumn } from './DataTable'

interface Row {
  id: string
  name: string
}

const rows: Row[] = [{ id: '1', name: 'Sunrise PG' }]
const columns: DataTableColumn<Row>[] = [{ key: 'name', header: 'Name', render: (r) => r.name }]

describe('DataTable', () => {
  it('makes a clickable row keyboard-operable via Enter and Space', async () => {
    const user = userEvent.setup()
    const onRowClick = vi.fn()

    render(<DataTable columns={columns} data={rows} rowKey={(r) => r.id} onRowClick={onRowClick} emptyState={<div />} />)

    // Stays a real table row (role="button" on a <tr> would hide row/cell semantics from screen
    // readers) but is focusable and keyboard-operable.
    const row = screen.getByRole('row', { name: /Sunrise PG/i })
    expect(row).toHaveAttribute('tabIndex', '0')

    row.focus()
    await user.keyboard('{Enter}')
    expect(onRowClick).toHaveBeenCalledTimes(1)

    await user.keyboard(' ')
    expect(onRowClick).toHaveBeenCalledTimes(2)
  })

  it('does not make rows focusable when there is no row click handler', () => {
    render(<DataTable columns={columns} data={rows} rowKey={(r) => r.id} emptyState={<div />} />)

    expect(screen.getByRole('row', { name: /Sunrise PG/i })).not.toHaveAttribute('tabIndex')
    expect(screen.queryByRole('button', { name: /Sunrise PG/i })).not.toBeInTheDocument()
  })

  it('shows an error with retry instead of the empty state when loading failed', () => {
    render(<DataTable columns={columns} data={[]} rowKey={(r) => r.id} error={new Error('x')} onRetry={() => {}} emptyState={<div>empty</div>} />)
    expect(screen.getByRole('alert')).toBeInTheDocument()
    expect(screen.queryByText('empty')).not.toBeInTheDocument()
  })
})
