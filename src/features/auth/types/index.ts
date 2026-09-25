import type { AuthTokens, User } from '@/types/api'

export interface RegisterPayload {
  name: string
  email?: string
  phone?: string
  password: string
}

export interface LoginPayload {
  identifier: string
  password: string
}

export interface AuthResponse {
  user: User
  tokens: AuthTokens
}
