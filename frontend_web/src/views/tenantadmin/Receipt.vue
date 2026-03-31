<template>
  <div class="page">
    <div class="page-header">
      <div>
        <h1 class="page-title">Phiếu thu</h1>
      </div>
    </div>

    <div class="filter-bar">
      <div class="search-wrap">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <input v-model="filters.q" placeholder="Tìm tiểu thương, kiosk, ghi chú..." @input="debouncedFetch" />
      </div>
      <select v-model="filters.hinhThucThanhToan" @change="fetchData">
        <option value="">Tất cả hình thức</option>
        <option value="tien_mat">Tiền mặt</option>
        <option value="chuyen_khoan">Chuyển khoản</option>
      </select>
      <input class="date-input" v-model="filters.from_date" type="date" @change="fetchData" title="Từ ngày" />
      <input class="date-input" v-model="filters.to_date" type="date" @change="fetchData" title="Đến ngày" />
      <button class="btn-outline" @click="resetFilters">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-4.95"/></svg>
        Reset
      </button>
    </div>

    <div class="stat-cards">
      <div class="stat-card">
        <div class="stat-icon stat-icon--green">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
        </div>
        <div><div class="stat-label">Tổng phiếu thu</div><div class="stat-value">{{ meta.total }}</div></div>
      </div>
      <div class="stat-card">
        <div class="stat-icon stat-icon--blue">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
        </div>
        <div><div class="stat-label">Tổng tiền thu</div><div class="stat-value">{{ fmtMoney(summary.tongThu) }}</div></div>
      </div>
      <div class="stat-card">
        <div class="stat-icon stat-icon--amber">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2"/></svg>
        </div>
        <div><div class="stat-label">Tiền mặt</div><div class="stat-value">{{ fmtMoney(summary.tienMat) }}</div></div>
      </div>
      <div class="stat-card">
        <div class="stat-icon stat-icon--purple">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
        </div>
        <div><div class="stat-label">Chuyển khoản</div><div class="stat-value">{{ fmtMoney(summary.chuyenKhoan) }}</div></div>
      </div>
    </div>

    <div class="table-panel">
      <div class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>Mã phiếu</th>
              <th>Thu ngân</th>
              <th>Số tiền</th>
              <th>Hình thức</th>
              <th>Thời gian thu</th>
              <th>Ghi chú</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading"><td colspan="6"><div class="loading-bar"></div></td></tr>
            <template v-else>
              <tr v-for="r in items" :key="r.receipt_id" class="row-clickable" @click="openDetail(r)">
                <td><span class="receipt-code">#{{ r.receipt_id }}</span></td>
                <td class="cell-main">{{ r.nhanVienThu || '—' }}</td>
                <td class="cell-money cell-money--green">{{ fmtMoney(r.soTienThu) }}</td>
                <td>
                  <span class="badge" :class="r.hinhThucThanhToan === 'tien_mat' ? 'badge--amber' : 'badge--blue'">
                    {{ r.hinhThucThanhToan === 'tien_mat' ? 'Tiền mặt' : 'Chuyển khoản' }}
                  </span>
                </td>
                <td class="cell-date">{{ fmtDt(r.thoiGianThu) }}</td>
                <td class="cell-sub">{{ r.ghiChu || '—' }}</td>
              </tr>
              <tr v-if="!items.length">
                <td colspan="6" class="empty-row">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#b0c4b0" stroke-width="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/></svg>
                  <p>Chưa có phiếu thu nào</p>
                </td>
              </tr>
            </template>
          </tbody>
        </table>
      </div>
      <div class="table-foot">
        <span class="total-label">{{ meta.total }} phiếu thu</span>
        <div class="pagination" v-if="meta.totalPages > 1">
          <button :disabled="pg.page <= 1" @click="changePage(pg.page-1)">← Trước</button>
          <span>{{ pg.page }} / {{ meta.totalPages }}</span>
          <button :disabled="pg.page >= meta.totalPages" @click="changePage(pg.page+1)">Tiếp →</button>
        </div>
      </div>
    </div>

    <div v-if="detailDrawer" class="drawer-overlay" @click.self="detailDrawer = false">
      <div class="drawer">
        <div class="drawer-header">
          <div>
            <h3>Phiếu thu #{{ detailData?.receipt?.receipt_id }}</h3>
            <p class="drawer-sub">{{ detailData?.receipt?.nhanVienThu }}</p>
          </div>
          <button class="modal-close" @click="detailDrawer = false">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <div class="drawer-body" v-if="detailData">
          <div class="detail-section">
            <div class="detail-section-title">Thông tin phiếu</div>
            <div class="detail-grid">
              <div class="detail-item"><span class="detail-label">Số tiền</span><span class="detail-val green">{{ fmtMoney(detailData.receipt.soTienThu) }}</span></div>
              <div class="detail-item">
                <span class="detail-label">Hình thức</span>
                <span class="badge" :class="detailData.receipt.hinhThucThanhToan === 'tien_mat' ? 'badge--amber' : 'badge--blue'">
                  {{ detailData.receipt.hinhThucThanhToan === 'tien_mat' ? 'Tiền mặt' : 'Chuyển khoản' }}
                </span>
              </div>
              <div class="detail-item"><span class="detail-label">Thời gian thu</span><span class="detail-val">{{ fmtDt(detailData.receipt.thoiGianThu) }}</span></div>
              <div class="detail-item"><span class="detail-label">Ghi chú</span><span class="detail-val">{{ detailData.receipt.ghiChu || '—' }}</span></div>
            </div>
          </div>

          <div class="detail-section" v-if="detailData.receipt.anhChupThanhToan">
            <div class="detail-section-title">Ảnh xác nhận</div>
            <img :src="detailData.receipt.anhChupThanhToan" class="receipt-img" />
          </div>

          <div class="detail-section" v-if="detailData.charges?.length">
            <div class="detail-section-title">Khoản phí đã thanh toán</div>
            <div class="charge-list">
              <div v-for="c in detailData.charges" :key="c.charge_id" class="charge-item">
                <div class="charge-item-left">
                  <div class="charge-merchant">{{ c.merchant }}</div>
                  <div class="charge-meta">{{ c.kiosk }} · {{ c.kyThu }}</div>
                </div>
                <div class="charge-amount">{{ fmtMoney(c.soTienDaTra) }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import api from '@/api/axios'

const loading      = ref(true)
const detailDrawer = ref(false)
const detailData   = ref<any>(null)
const items        = ref<any[]>([])
const meta         = ref({ total: 0, totalPages: 1 })
const pg           = reactive({ page: 1, limit: 10 })
const filters      = reactive({ q: '', hinhThucThanhToan: '', from_date: '', to_date: '' })
const summary      = reactive({ tongThu: 0, tienMat: 0, chuyenKhoan: 0 })

let debounceTimer: any
function debouncedFetch() { clearTimeout(debounceTimer); debounceTimer = setTimeout(() => { pg.page = 1; fetchData() }, 400) }

onMounted(() => fetchData())

async function fetchData() {
  loading.value = true
  try {
    const p: any = { page: pg.page, limit: pg.limit }
    if (filters.q)                   p.q                   = filters.q
    if (filters.hinhThucThanhToan)   p.hinhThucThanhToan   = filters.hinhThucThanhToan
    if (filters.from_date)           p.from_date           = filters.from_date
    if (filters.to_date)             p.to_date             = filters.to_date
    const res = await api.get('/receipts', { params: p })
    items.value = res.data.data || []
    meta.value  = res.data.meta || { total: 0, totalPages: 1 }
    summary.tongThu     = items.value.reduce((s, x) => s + Number(x.soTienThu || 0), 0)
    summary.tienMat     = items.value.filter(x => x.hinhThucThanhToan === 'tien_mat').reduce((s, x) => s + Number(x.soTienThu || 0), 0)
    summary.chuyenKhoan = items.value.filter(x => x.hinhThucThanhToan === 'chuyen_khoan').reduce((s, x) => s + Number(x.soTienThu || 0), 0)
  } catch { items.value = [] }
  finally { loading.value = false }
}

function resetFilters() { filters.q = ''; filters.hinhThucThanhToan = ''; filters.from_date = ''; filters.to_date = ''; pg.page = 1; fetchData() }
function changePage(p: number) { pg.page = p; fetchData() }

async function openDetail(r: any) {
  detailData.value = null; detailDrawer.value = true
  try {
    const res = await api.get(`/receipts/${r.receipt_id}`)
    detailData.value = res.data
  } catch { detailData.value = { receipt: r, charges: [] } }
}

function fmtMoney(n: any) { return Number(n || 0).toLocaleString('vi-VN', { style: 'currency', currency: 'VND' }) }
function fmtDt(d: string) { return d ? new Date(d).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' }) : '—' }
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
.stat-icon--amber  { background: #fffbeb; color: #b45309; }
.stat-icon--purple { background: #f5f3ff; color: #6d28d9; }
.stat-label { font-size: 11.5px; color: #6b836b; margin-bottom: 3px; }
.stat-value { font-size: 15px; font-weight: 600; color: #1a2e1a; }
.table-panel { background: white; border: 1px solid #e2ede2; border-radius: 14px; overflow: hidden; }
.table-wrap { overflow-x: auto; }
.data-table { width: 100%; border-collapse: collapse; }
.data-table th { padding: 11px 14px; font-size: 11px; font-weight: 600; color: #94a894; text-transform: uppercase; letter-spacing: .06em; text-align: left; background: #fafcfa; border-bottom: 1px solid #f0f5f0; white-space: nowrap; }
.data-table td { padding: 13px 14px; border-bottom: 1px solid #f7faf7; vertical-align: middle; }
.row-clickable { cursor: pointer; }
.data-table tbody tr.row-clickable:hover td { background: #fafcfa; }
.data-table tbody tr:last-child td { border-bottom: none; }
.receipt-code { font-size: 13px; font-weight: 600; color: #1a2e1a; background: #f0f5f0; padding: 2px 8px; border-radius: 5px; font-family: monospace; }
.cell-main { font-size: 13.5px; font-weight: 500; color: #1a2e1a; }
.cell-sub { font-size: 12.5px; color: #6b836b; }
.cell-money { font-size: 13px; font-weight: 500; color: #1a2e1a; white-space: nowrap; }
.cell-money--green { color: #2d6e2d; }
.cell-date { font-size: 12.5px; color: #6b836b; white-space: nowrap; }
.badge { display: inline-flex; align-items: center; padding: 3px 9px; border-radius: 20px; font-size: 11.5px; font-weight: 500; }
.badge--amber  { background: #fffbeb; color: #b45309; }
.badge--blue   { background: #eff6ff; color: #1d4ed8; }
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
.detail-section { display: flex; flex-direction: column; gap: 0; }
.detail-section-title { font-size: 11px; font-weight: 600; color: #94a894; text-transform: uppercase; letter-spacing: .07em; margin-bottom: 12px; }
.detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.detail-item { display: flex; flex-direction: column; gap: 4px; }
.detail-label { font-size: 11.5px; color: #94a894; }
.detail-val { font-size: 13.5px; color: #1a2e1a; font-weight: 500; }
.detail-val.green { color: #2d6e2d; font-size: 16px; }
.receipt-img { width: 100%; border-radius: 10px; border: 1px solid #e2ede2; }
.charge-list { display: flex; flex-direction: column; gap: 8px; }
.charge-item { display: flex; align-items: center; justify-content: space-between; background: #f7faf7; border-radius: 10px; padding: 11px 14px; }
.charge-merchant { font-size: 13px; font-weight: 500; color: #1a2e1a; margin-bottom: 2px; }
.charge-meta { font-size: 11.5px; color: #6b836b; }
.charge-amount { font-size: 14px; font-weight: 600; color: #2d6e2d; white-space: nowrap; }
@media (max-width: 900px) { .stat-cards { grid-template-columns: repeat(2, 1fr); } }
</style>