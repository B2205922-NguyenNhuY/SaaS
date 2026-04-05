import api from './index'
import { User } from '@/types'

export const userAPI = {
  getUsers: (params?: { role?: string; status?: string }) =>
    api.get('/users', { params }),

  getUsersByRole: (role: string) =>
    api.get(`/users/role/${role}`),

  getUserById: (id: number) =>
    api.get(`/users/${id}`),

  createUser: (data: Partial<User> & { password: string }) =>
    api.post('/users', data),

  updateUser: (id: number, data: Partial<User> & { password?: string }) =>
    api.put(`/users/${id}`, data),

  deleteUser: (id: number) =>
    api.delete(`/users/${id}`),

  toggleUserStatus: (id: number, status: 'active' | 'suspended') =>
    api.patch(`/users/${id}/status`, { trangThai: status }),

  getRoles: () =>
    api.get('/roles'),
}