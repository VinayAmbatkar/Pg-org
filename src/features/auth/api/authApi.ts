import { apiClient } from '@/infrastructure/api/client'
import type { AuthTokens, User } from '@/types/api'
import type { AuthResponse, LoginPayload, RegisterPayload } from '../types'

export const authApi = {
  async register(payload: RegisterPayload): Promise<AuthResponse> {
    const body: Record<string, string> = { name: payload.name, password: payload.password }
    if (payload.email) body.email = payload.email
    if (payload.phone) body.phone = payload.phone
    const { data } = await apiClient.post<AuthResponse>('/auth/register', body)
    return data
  },

  async login(payload: LoginPayload): Promise<AuthResponse> {
    const { data } = await apiClient.post<AuthResponse>('/auth/login', payload)
    return data
  },

  async logout(refreshToken: string): Promise<void> {
    await apiClient.post('/auth/logout', { refreshToken })
  },

  async me(): Promise<User> {
    const { data } = await apiClient.get<User>('/auth/me')
    return data
  },

  async refresh(refreshToken: string): Promise<AuthTokens> {
    const { data } = await apiClient.post<AuthTokens>('/auth/refresh', { refreshToken })
    return data
  },
}
