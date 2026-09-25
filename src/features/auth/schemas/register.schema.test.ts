import { describe, expect, it } from 'vitest'
import { registerSchema } from './register.schema'

describe('registerSchema', () => {
  it('rejects a submission with neither email nor phone', () => {
    const result = registerSchema.safeParse({ name: 'Jane Doe', password: 'password123' })
    expect(result.success).toBe(false)
  })

  it('accepts email only', () => {
    const result = registerSchema.safeParse({
      name: 'Jane Doe',
      email: 'jane@example.com',
      password: 'password123',
    })
    expect(result.success).toBe(true)
  })

  it('accepts phone only', () => {
    const result = registerSchema.safeParse({
      name: 'Jane Doe',
      phone: '+919876543210',
      password: 'password123',
    })
    expect(result.success).toBe(true)
  })

  it('rejects a password shorter than 8 characters', () => {
    const result = registerSchema.safeParse({
      name: 'Jane Doe',
      email: 'jane@example.com',
      password: 'short',
    })
    expect(result.success).toBe(false)
  })
})
