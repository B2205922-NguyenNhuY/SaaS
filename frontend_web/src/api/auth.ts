import api from './index'
import { ApiResponse, User } from '@/types'

export interface LoginCredentials {
  email: string
  password: string
}

export interface GoogleLoginData {
  idToken: string
}

export const authAPI = {
  login: (credentials: LoginCredentials) =>
    api.post<ApiResponse & { token: string; user: User }>('/auth/login', credentials),

  googleLogin: (data: GoogleLoginData) =>
    api.post<ApiResponse & { token: string; user: User }>('/auth/google-login', data),

  logout: () =>
    api.post<ApiResponse>('/auth/logout'),
}