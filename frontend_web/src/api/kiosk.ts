import api from './index'
import { Kiosk } from '@/types'

export const kioskAPI = {
  getKiosks: (params?: { tenant_id?: number; market_id?: number; zone_id?: number; status?: string }) =>
    api.get('/kiosks', { params }),

  getKioskById: (id: number) =>
    api.get(`/kiosks/${id}`),

  createKiosk: (data: Partial<Kiosk>) =>
    api.post('/kiosks', data),

  updateKiosk: (id: number, data: Partial<Kiosk>) =>
    api.patch(`/kiosks/${id}`, data),

  deleteKiosk: (id: number) =>
    api.delete(`/kiosks/${id}`),

  getKioskTypes: () =>
    api.get('/kiosk-types'),
}