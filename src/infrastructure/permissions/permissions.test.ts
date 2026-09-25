import { describe, expect, it } from 'vitest'
import { hasAllPermissions, hasAnyPermission, hasPermission } from './permissions'

describe('hasPermission', () => {
  it('allows OWNER to manage and archive properties', () => {
    expect(hasPermission('OWNER', 'properties.manage')).toBe(true)
    expect(hasPermission('OWNER', 'properties.archive')).toBe(true)
  })

  it('allows MANAGER to manage but not archive properties', () => {
    expect(hasPermission('MANAGER', 'properties.manage')).toBe(true)
    expect(hasPermission('MANAGER', 'properties.archive')).toBe(false)
  })

  it('only allows STAFF to view, never manage', () => {
    expect(hasPermission('STAFF', 'properties.view')).toBe(true)
    expect(hasPermission('STAFF', 'properties.manage')).toBe(false)
    expect(hasPermission('STAFF', 'residency.manage')).toBe(false)
  })

  it('denies everything when there is no role yet', () => {
    expect(hasPermission(null, 'dashboard.view')).toBe(false)
    expect(hasPermission(undefined, 'properties.view')).toBe(false)
  })

  it('only OWNER can manage the organization itself', () => {
    expect(hasPermission('OWNER', 'organizations.manage')).toBe(true)
    expect(hasPermission('MANAGER', 'organizations.manage')).toBe(false)
  })
})

describe('hasAnyPermission / hasAllPermissions', () => {
  it('hasAnyPermission is true if at least one permission matches', () => {
    expect(hasAnyPermission('STAFF', ['properties.manage', 'properties.view'])).toBe(true)
  })

  it('hasAllPermissions requires every permission to match', () => {
    expect(hasAllPermissions('MANAGER', ['properties.view', 'properties.manage'])).toBe(true)
    expect(hasAllPermissions('MANAGER', ['properties.view', 'properties.archive'])).toBe(false)
  })
})
