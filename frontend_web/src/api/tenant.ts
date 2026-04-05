import api from './index'
import { Tenant, Plan } from '@/types'

export const tenantAPI = {
  // Tenant management
  getTenants: (params?: { page?: number; limit?: number }) =>
    api.get('/tenants', { params }),

  getTenantById: (id: number) =>
    api.get(`/tenants/${id}`),

  createTenant: (data: Partial<Tenant>) =>
    api.post('/tenants', data),

  updateTenant: (id: number, data: Partial<Tenant>) =>
    api.patch(`/tenants/${id}`, data),

  deleteTenant: (id: number) =>
    api.delete(`/tenants/${id}`),

  // Plan management
  getPlans: () =>
    api.get('/plans'),

  createPlan: (data: Partial<Plan>) =>
    api.post('/plans', data),

  updatePlan: (id: number, data: Partial<Plan>) =>
    api.patch(`/plans/${id}`, data),

  assignPlanToTenant: (tenantId: number, planId: number) =>
    api.post(`/tenants/${tenantId}/assign-plan`, { plan_id: planId }),
}