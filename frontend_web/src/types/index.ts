export interface User {
  id: number
  email: string
  hoTen: string
  soDienThoai?: string
  tenant_id: number | null
  role: 'super_admin' | 'tenant_admin' | 'collector' | 'merchant'
  trangThai: 'active' | 'suspended' | 'deleted'
}

export interface Tenant {
  tenant_id: number
  tenBanQuanLy: string
  diaChi: string
  soDienThoai: string
  email: string
  trangThai: 'active' | 'suspended'
  created_at: string
}

export interface Plan {
  plan_id: number
  tenGoi: string
  giaTien: number
  gioiHanSoKiosk: number
  gioiHanUser: number
  gioiHanSoCho: number
  trangThai: 'active' | 'inactive'
}

export interface Market {
  market_id: number
  tenCho: string
  diaChi: string
  dienTich?: number
  trangThai: 'active' | 'locked'
}

export interface Zone {
  zone_id: number
  tenKhu: string
  trangThai: 'active' | 'locked'
}

export interface Kiosk {
  kiosk_id: number
  maKiosk: string
  viTri: string
  dienTich: number
  trangThai: 'available' | 'occupied' | 'maintenance' | 'locked'
  type_id: number
  tenLoai?: string
}

export interface Merchant {
  merchant_id: number
  hoTen: string
  soDienThoai: string
  CCCD: string
  maSoThue?: string
  diaChiThuongTru?: string
  trangThai: 'active' | 'inactive'
}

export interface FeeSchedule {
  fee_id: number
  tenBieuPhi: string
  hinhThuc: 'ngay' | 'thang'
  donGia: number
  moTa?: string
}

export interface Charge {
  charge_id: number
  soTienPhaiThu: number
  soTienDaThu: number
  trangThai: 'chua_thu' | 'da_thu' | 'no' | 'mien'
  period_id: number
}

export interface ApiResponse<T = any> {
  message?: string
  data?: T
  token?: string
  user?: User
}