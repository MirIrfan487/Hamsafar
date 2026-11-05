import { apiRequest } from './api'

// These must match the C# enums exactly (the API sends enums as text)
export type ProfileFor = 'Self' | 'Son' | 'Daughter' | 'Brother' | 'Sister' | 'Relative'
export type Gender = 'Male' | 'Female'

export interface RegisterData {
  email: string
  password: string
  firstName: string
  profileFor: ProfileFor
  gender: Gender
  dateOfBirth: string // "YYYY-MM-DD"
}

export interface CurrentUser {
  id: string
  email: string
  firstName: string
  roles: string[]
}

// An admin login with no member profile (like admin@matrimony.test).
// It only uses the admin panel: no dashboard, search, interests or chat.
export const isAdminOnly = (user: CurrentUser) => user.roles.includes('Admin') && !user.firstName

export interface LoginResponse {
  token: string
  expiresAtUtc: string
  user: CurrentUser
}

export const authApi = {
  register: (data: RegisterData) =>
    apiRequest<{ message: string; userId: string }>('/auth/register', { method: 'POST', body: data }),

  login: (email: string, password: string) =>
    apiRequest<LoginResponse>('/auth/login', { method: 'POST', body: { email, password } }),

  me: () => apiRequest<CurrentUser>('/auth/me', { auth: true }),
}
