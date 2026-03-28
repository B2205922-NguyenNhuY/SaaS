<template>
  <div class="page">
    <div class="page-header">
      <div>
        <h1 class="page-title">Ca làm việc</h1>
        <p class="page-sub">Lịch sử ca thu tiền của thu ngân</p>
      </div>
    </div>

    <div class="filter-bar">
      <div class="search-wrap">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <input v-model="filters.keyword" placeholder="Tìm thu ngân..." @input="debouncedFetch" />
      </div>
      <select v-model="filters.trangThaiDoiSoat" @change="fetchData">
        <option value="">Tất cả đối soát</option>
        <option value="pending">Chờ đối soát</option>
        <option value="completed">Đã đối soát</option>
        <option value="discrepancy">Lệch số</option>
      </select>
      <input class="date-input" v-model="filters.dateFrom" type="date" @change="fetchData" title="Từ ngày" />
      <input class="date-input" v-model="filters.dateTo" type="date" @change="fetchData" title="Đến ngày" />
      <button class="btn-outline" @click="resetFilters">Reset</button>
    </div>

    <div class="stat-cards">
      <div class="stat-card">
        <div class="stat-icon stat-icon--green">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>
        </div>
        <div>
          <div class="stat-label">Tổng ca</div>
          <div class="stat-value">{{ meta.total }}</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon stat-icon--blue">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
        </div>
        <div>
          <div class="stat-label">Tiền mặt thu được</div>
          <div class="stat-value">{{ fmtMoney(summary.tienMat) }}</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon stat-icon--purple">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
        </div>
        <div>
          <div class="stat-label">Chuyển khoản</div>
          <div class="stat-value">{{ fmtMoney(summary.chuyenKhoan) }}</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon stat-icon--amber">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
        </div>
        <div>
          <div class="stat-label">Ca đang mở</div>
          <div class="stat-value">{{ summary.caAngMo }}</div>
        </div>
      </div>
    </div>

    <div class="table-panel">
      <div class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>Thu ngân</th>
              <th>Bắt đầu ca</th>
              <th>Kết thúc ca</th>
              <th>Tiền mặt</th>
              <th>Chuyển khoản</th>
              <th>Đối soát</th>
              <th>Trạng thái</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading"><td colspan="7"><div class="loading-bar"></div></td></tr>
            <template v-else>
              <tr v-for="s in items" :key="s.shift_id" class="row-clickable" @click="openDetail(s)">
                <td>
                  <div class="cell-with-avatar">
                    <div class="c-avatar">{{ initials(s.hoTen) }}</div>
                    <div class="cell-main">{{ s.hoTen }}</div>
                  </div>
                </td>
                <td class="cell-date">{{ fmtDt(s.thoiGianBatDauCa) }}</td>
                <td class="cell-date">{{ s.thoiGianKetThucCa ? fmtDt(s.thoiGianKetThucCa) : '—' }}</td>
                <td class="cell-money">{{ fmtMoney(s.tongTienMatThuDuoc) }}</td>
                <td class="cell-money">{{ fmtMoney(s.tongChuyenKhoanThuDuoc) }}</td>
                <td>
                  <span class="badge" :class="doiSoatClass(s.trangThaiDoiSoat)">
                    {{ doiSoatLabel(s.trangThaiDoiSoat) }}
                  </span>
                </td>
                <td>
                  <span v-if="!s.thoiGianKetThucCa" class="badge badge--active">
                    <span class="dot-live"></span> Đang mở
                  </span>
                  <span v-else class="badge badge--gray">Đã đóng</span>
                </td>
              </tr>
              <tr v-if="!items.length">
                <td colspan="7" class="empty-row">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#b0c4b0" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                  <p>Chưa có ca làm việc nào</p>
                </td>
              </tr>
            </template>
          </tbody>
        </table>
      </div>
      <div class="table-foot">
        <span class="total-label">{{ meta.total }} ca</span>
        <div class="pagination" v-if="meta.totalPages > 1">
          <button :disabled="pg.page <= 1" @click="changePage(pg.page - 1)">← Trước</button>
          <span>{{ pg.page }} / {{ meta.totalPages }}</span>
          <button :disabled="pg.page >= meta.totalPages" @click="changePage(pg.page + 1)">Tiếp →</button>
        </div>
      </div>
    </div>

    <div v-if="detailDrawer" class="drawer-overlay" @click.self="detailDrawer = false">
      <div class="drawer">
        <div class="drawer-header">
          <div>
            <h3>Chi tiết ca #{{ selected?.shift_id }}</h3>
            <p class="drawer-sub">{{ selected?.hoTen }}</p>
          </div>
          <button class="modal-close" @click="detailDrawer = false">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <div class="drawer-body" v-if="selected">
          <div class="detail-section">
            <div class="detail-section-title">Thông tin ca</div>
            <div class="detail-grid">
              <div class="detail-item">
                <span class="detail-label">Bắt đầu</span>
                <span class="detail-val">{{ fmtDt(selected.thoiGianBatDauCa) }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Kết thúc</span>
                <span class="detail-val">{{ selected.thoiGianKetThucCa ? fmtDt(selected.thoiGianKetThucCa) : 'Chưa đóng ca' }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Thời gian làm</span>
                <span class="detail-val">{{ duration(selected.thoiGianBatDauCa, selected.thoiGianKetThucCa) }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Trạng thái đối soát</span>
                <span class="badge" :class="doiSoatClass(selected.trangThaiDoiSoat)">{{ doiSoatLabel(selected.trangThaiDoiSoat) }}</span>
              </div>
            </div>
          </div>

          <div class="detail-section">
            <div class="detail-section-title">Tổng kết thu tiền</div>
            <div class="money-cards">
              <div class="money-card money-card--cash">
                <div class="money-card-label">Tiền mặt</div>
                <div class="money-card-value">{{ fmtMoney(selected.tongTienMatThuDuoc) }}</div>
              </div>
              <div class="money-card money-card--transfer">
                <div class="money-card-label">Chuyển khoản</div>
                <div class="money-card-value">{{ fmtMoney(selected.tongChuyenKhoanThuDuoc) }}</div>
              </div>
              <div class="money-card money-card--total">
                <div class="money-card-label">Tổng cộng</div>
                <div class="money-card-value">{{ fmtMoney((selected.tongTienMatThuDuoc || 0) + (selected.tongChuyenKhoanThuDuoc || 0)) }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import api from '@/api/axios'

const loading      = ref(true)
const detailDrawer = ref(false)
const selected     = ref<any>(null)
const items        = ref<any[]>([])
const meta         = ref({ total: 0, totalPages: 1 })
const pg           = reactive({ page: 1, limit: 10 })
const filters      = reactive({ keyword: '', trangThaiDoiSoat: '', dateFrom: '', dateTo: '' })

const summary = reactive({ tienMat: 0, chuyenKhoan: 0, caAngMo: 0 })

let debounceTimer: any
function debouncedFetch() { clearTimeout(debounceTimer); debounceTimer = setTimeout(() => { pg.page = 1; fetchData() }, 400) }

onMounted(() => fetchData())

async function fetchData() {
  loading.value = true
  try {
    const params: any = { page: pg.page, limit: pg.limit }
    if (filters.keyword)          params.keyword          = filters.keyword
    if (filters.trangThaiDoiSoat) params.trangThaiDoiSoat = filters.trangThaiDoiSoat
    if (filters.dateFrom)         params.dateFrom          = filters.dateFrom
    if (filters.dateTo)           params.dateTo            = filters.dateTo

    const res = await api.get('/shifts', { params })
    items.value = res.data.data || []
    meta.value  = res.data.meta || { total: 0, totalPages: 1 }

    summary.tienMat     = items.value.reduce((s, x) => s + Number(x.tongTienMatThuDuoc || 0), 0)
    summary.chuyenKhoan = items.value.reduce((s, x) => s + Number(x.tongChuyenKhoanThuDuoc || 0), 0)
    summary.caAngMo     = items.value.filter(x => !x.thoiGianKetThucCa).length
  } catch { items.value = [] }
  finally { loading.value = false }
}

function resetFilters() {
  filters.keyword = ''; filters.trangThaiDoiSoat = ''
  filters.dateFrom = ''; filters.dateTo = ''
  pg.page = 1; fetchData()
}

function changePage(p: number) { pg.page = p; fetchData() }

function openDetail(s: any) { selected.value = s; detailDrawer.value = true }

function doiSoatClass(s: string) {
  return { pending: 'badge--amber', completed: 'badge--green', discrepancy: 'badge--red' }[s] || 'badge--gray'
}
function doiSoatLabel(s: string) {
  return { pending: 'Chờ đối soát', completed: 'Đã đối soát', discrepancy: 'Lệch số' }[s] || s
}

function duration(start: string, end: string) {
  if (!start) return '—'
  const s = new Date(start)
  const e = end ? new Date(end) : new Date()
  const diff = Math.floor((e.getTime() - s.getTime()) / 1000)
  const h = Math.floor(diff / 3600)
  const m = Math.floor((diff % 3600) / 60)
  return `${h}g ${m}p${!end ? ' (đang mở)' : ''}`
}

function fmtDt(d: string) {
  return d ? new Date(d).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' }) : '—'
}
function fmtMoney(n: any) {
  return Number(n || 0).toLocaleString('vi-VN', { style: 'currency', currency: 'VND' })
}
function initials(n: string) { return (n || '?').split(' ').map((w: string) => w[0]).slice(-2).join('').toUpperCase() }
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@300;400;500;600&display=swap');
*, *::before, *::after { box-sizing: border-box; }
.page { display: flex; flex-direction: column; gap: 18px; font-family: 'Be Vietnam Pro', sans-serif; }
.page-header { display: flex; justify-content: space-between; align-items: flex-start; }
.page-title { font-size: 22px; font-weight: 600; color: #1a2e1a; margin: 0 0 4px; }
.page-sub { font-size: 13px; color: #6b836b; margin: 0; }

.filter-bar { display: flex; gap: 10px; flex-wrap: wrap; align-items: center; }
.search-wrap { flex: 1; min-width: 180px; max-width: 260px; position: relative; display: flex; align-items: center; }
.search-wrap svg { position: absolute; left: 11px; color: #94a894; pointer-events: none; }
.search-wrap input { width: 100%; height: 38px; padding: 0 12px 0 33px; border: 1.5px solid #d4e4d4; border-radius: 10px; font-size: 13px; font-family: 'Be Vietnam Pro', sans-serif; color: #1a2e1a; background: white; outline: none; }
.search-wrap input:focus { border-color: #3d8c3d; }
select { height: 38px; padding: 0 10px; border: 1.5px solid #d4e4d4; border-radius: 10px; font-size: 13px; font-family: 'Be Vietnam Pro', sans-serif; color: #1a2e1a; background: white; outline: none; }
.date-input { height: 38px; padding: 0 10px; border: 1.5px solid #d4e4d4; border-radius: 10px; font-size: 13px; font-family: 'Be Vietnam Pro', sans-serif; color: #1a2e1a; background: white; outline: none; }
.date-input:focus { border-color: #3d8c3d; }

.stat-cards { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
.stat-card { background: white; border: 1px solid #e2ede2; border-radius: 12px; padding: 16px; display: flex; align-items: center; gap: 14px; }
.stat-icon { width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.stat-icon--green  { background: #eef7ee; color: #3d8c3d; }
.stat-icon--blue   { background: #eff6ff; color: #1d4ed8; }
.stat-icon--purple { background: #f5f3ff; color: #6d28d9; }
.stat-icon--amber  { background: #fffbeb; color: #b45309; }
.stat-label { font-size: 11.5px; color: #6b836b; margin-bottom: 3px; }
.stat-value { font-size: 18px; font-weight: 600; color: #1a2e1a; }

.table-panel { background: white; border: 1px solid #e2ede2; border-radius: 14px; overflow: hidden; }
.table-wrap { overflow-x: auto; }
.data-table { width: 100%; border-collapse: collapse; }
.data-table th { padding: 11px 14px; font-size: 11px; font-weight: 600; color: #94a894; text-transform: uppercase; letter-spacing: .06em; text-align: left; background: #fafcfa; border-bottom: 1px solid #f0f5f0; white-space: nowrap; }
.data-table td { padding: 13px 14px; border-bottom: 1px solid #f7faf7; vertical-align: middle; }
.row-clickable { cursor: pointer; }
.data-table tbody tr.row-clickable:hover td { background: #fafcfa; }
.data-table tbody tr:last-child td { border-bottom: none; }
.cell-with-avatar { display: flex; align-items: center; gap: 9px; }
.c-avatar { width: 32px; height: 32px; background: #0f766e; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 700; color: white; flex-shrink: 0; }
.cell-main { font-size: 13.5px; font-weight: 500; color: #1a2e1a; }
.cell-date { font-size: 12.5px; color: #6b836b; white-space: nowrap; }
.cell-money { font-size: 13px; font-weight: 500; color: #1a2e1a; white-space: nowrap; }

.badge { display: inline-flex; align-items: center; gap: 5px; padding: 3px 9px; border-radius: 20px; font-size: 11.5px; font-weight: 500; }
.badge--green  { background: #eef7ee; color: #2d6e2d; }
.badge--amber  { background: #fffbeb; color: #b45309; }
.badge--red    { background: #fef2f2; color: #dc2626; }
.badge--gray   { background: #f4f4f4; color: #6b7280; }
.badge--active { background: #eff6ff; color: #1d4ed8; }
.dot-live { width: 6px; height: 6px; background: #1d4ed8; border-radius: 50%; animation: blink 1.2s infinite; }
@keyframes blink { 0%,100%{opacity:1} 50%{opacity:.3} }

.empty-row { text-align: center; padding: 48px 16px !important; color: #94a894; }
.empty-row p { margin: 8px 0 0; font-size: 13px; }
.loading-bar { height: 3px; background: linear-gradient(90deg,#eef7ee,#3d8c3d,#eef7ee); background-size: 200%; animation: shimmer 1.5s infinite; }
@keyframes shimmer { to { background-position: -200% center; } }
.table-foot { display: flex; justify-content: space-between; align-items: center; padding: 12px 16px; border-top: 1px solid #f0f5f0; }
.total-label { font-size: 12.5px; color: #94a894; }
.pagination { display: flex; align-items: center; gap: 10px; }
.pagination button { height: 32px; padding: 0 14px; background: white; border: 1px solid #e2ede2; border-radius: 8px; cursor: pointer; font-size: 12.5px; font-family: 'Be Vietnam Pro', sans-serif; color: #4a654a; }
.pagination button:hover:not(:disabled) { background: #f0f7f0; }
.pagination button:disabled { opacity: 0.4; cursor: not-allowed; }
.pagination span { font-size: 12.5px; color: #6b836b; }

.btn-outline { display: inline-flex; align-items: center; gap: 6px; height: 38px; padding: 0 14px; background: white; border: 1.5px solid #d4e4d4; border-radius: 10px; color: #4a654a; font-size: 13px; font-family: 'Be Vietnam Pro', sans-serif; cursor: pointer; }
.btn-outline:hover { background: #f0f7f0; }

.drawer-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.3); z-index: 200; display: flex; justify-content: flex-end; }
.drawer { width: 420px; max-width: 95vw; background: white; height: 100%; display: flex; flex-direction: column; box-shadow: -4px 0 32px rgba(0,0,0,0.12); }
.drawer-header { padding: 20px 22px 14px; border-bottom: 1px solid #f0f5f0; display: flex; justify-content: space-between; align-items: flex-start; }
.drawer-header h3 { font-size: 16px; font-weight: 600; color: #1a2e1a; margin: 0 0 3px; }
.drawer-sub { font-size: 13px; color: #6b836b; margin: 0; }
.drawer-body { flex: 1; overflow-y: auto; padding: 20px 22px; display: flex; flex-direction: column; gap: 22px; }
.modal-close { background: none; border: none; color: #94a894; cursor: pointer; display: flex; align-items: center; padding: 4px; border-radius: 6px; }
.modal-close:hover { background: #f0f5f0; }

.detail-section-title { font-size: 11px; font-weight: 600; color: #94a894; text-transform: uppercase; letter-spacing: .07em; margin-bottom: 12px; }
.detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.detail-item { display: flex; flex-direction: column; gap: 3px; }
.detail-label { font-size: 11.5px; color: #94a894; }
.detail-val { font-size: 13.5px; color: #1a2e1a; font-weight: 500; }

.money-cards { display: flex; flex-direction: column; gap: 8px; }
.money-card { border-radius: 10px; padding: 12px 16px; display: flex; justify-content: space-between; align-items: center; }
.money-card--cash     { background: #f0fdf4; border: 1px solid #bbf7d0; }
.money-card--transfer { background: #eff6ff; border: 1px solid #bfdbfe; }
.money-card--total    { background: #f7faf7; border: 1px solid #e2ede2; }
.money-card-label { font-size: 13px; color: #4a654a; }
.money-card-value { font-size: 15px; font-weight: 600; color: #1a2e1a; }

@media (max-width: 900px) { .stat-cards { grid-template-columns: repeat(2, 1fr); } }
</style>