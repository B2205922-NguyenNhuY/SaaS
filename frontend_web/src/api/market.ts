import api from './index'
import { Market, Zone } from '@/types'

export const marketAPI = {
  // Market management
  getMarkets: (params?: { tenant_id?: number }) =>
    api.get('/markets', { params }),

  getMarketById: (id: number) =>
    api.get(`/markets/${id}`),

  createMarket: (data: Partial<Market>) =>
    api.post('/markets', data),

  updateMarket: (id: number, data: Partial<Market>) =>
    api.patch(`/markets/${id}`, data),

  deleteMarket: (id: number) =>
    api.delete(`/markets/${id}`),

  // Zone management
  getZones: (marketId: number) =>
    api.get(`/markets/${marketId}/zones`),

  createZone: (marketId: number, data: Partial<Zone>) =>
    api.post(`/markets/${marketId}/zones`, data),

  updateZone: (id: number, data: Partial<Zone>) =>
    api.patch(`/zones/${id}`, data),

  deleteZone: (id: number) =>
    api.delete(`/zones/${id}`),
}