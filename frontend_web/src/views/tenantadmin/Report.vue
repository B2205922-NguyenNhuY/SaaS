<template>
  <div class="report-page">
    <div class="page-header">
      <div>
        <h1 class="page-title">Báo cáo doanh thu</h1>
      </div>
      <button class="btn-outline" @click="exportExcel" :disabled="exporting">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
          <line x1="12" y1="18" x2="12" y2="12"/>
          <line x1="9" y1="15" x2="15" y2="15"/>
        </svg>
        {{ exporting ? 'Đang xuất...' : 'Xuất Excel' }}
      </button>
    </div>

    <div class="filter-bar">
      <div class="date-range">
        <div class="date-input-wrap">
          <label>Từ ngày</label>
          <input type="date" v-model="filters.from" class="date-input" />
        </div>
        <div class="date-input-wrap">
          <label>Đến ngày</label>
          <input type="date" v-model="filters.to" class="date-input" />
        </div>
        <button class="btn-primary" @click="fetchData">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="23 4 23 10 17 10"/>
            <polyline points="1 20 1 14 7 14"/>
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
          </svg>
          Thống kê
        </button>
      </div>
    </div>

    <div class="stats-grid">
      <div class="stat-card total-card">
        <div class="stat-icon-wrap" style="background: #eef7ee;">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#3d8c3d" stroke-width="2">
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
            <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
            <line x1="12" y1="22.08" x2="12" y2="12"/>
          </svg>
        </div>
        <div class="stat-info">
          <div class="stat-val">{{ formatCurrency(totalRevenue) }}</div>
          <div class="stat-lbl">Tổng doanh thu</div>
        </div>
      </div>

      <div class="stat-card stripe-card">
        <div class="stat-icon-wrap" style="background: #eff6ff;">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2">
            <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
            <line x1="1" y1="10" x2="23" y2="10"/>
          </svg>
        </div>
        <div class="stat-info">
          <div class="stat-val">{{ formatCurrency(stripeRevenue) }}</div>
          <div class="stat-lbl">Doanh thu chuyển khoản</div>
        </div>
      </div>

      <div class="stat-card cash-card">
        <div class="stat-icon-wrap" style="background: #fef3c7;">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#d97706" stroke-width="2">
            <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
            <circle cx="12" cy="12" r="3"/>
          </svg>
        </div>
        <div class="stat-info">
          <div class="stat-val">{{ formatCurrency(cashRevenue) }}</div>
          <div class="stat-lbl">Doanh thu tiền mặt</div>
        </div>
      </div>
    </div>

    <div class="grid-3">
      <div class="card">
        <div class="card-head">
          <h2 class="card-title">Doanh thu theo chợ</h2>
        </div>
        <div class="table-wrap">
          <table class="data-table">
            <thead>
              <tr><th>Chợ</th><th class="text-right">Doanh thu</th></tr>
            </thead>
            <tbody>
              <tr v-if="loadingMarket"><td colspan="2"><div class="loading-bar"></div></td></tr>
              <tr v-for="item in marketRevenue" :key="item.market_id">
                <td class="cell-main">{{ item.tenCho || '—' }}</td>
                <td class="text-right cell-amount">{{ formatCurrency(item.tongThu) }}</td>
              </tr>
              <tr v-if="!loadingMarket && !marketRevenue.length">
                <td colspan="2" class="empty-row">Chưa có dữ liệu</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="card">
        <div class="card-head">
          <h2 class="card-title">Doanh thu theo khu vực</h2>
        </div>
        <div class="table-wrap">
          <table class="data-table">
            <thead>
              <tr><th>Khu vực</th><th class="text-right">Doanh thu</th></tr>
            </thead>
            <tbody>
              <tr v-if="loadingZone"><td colspan="2"><div class="loading-bar"></div></td></tr>
              <tr v-for="item in zoneRevenue" :key="item.zone_id">
                <td class="cell-main">{{ item.tenKhu || '—' }}</td>
                <td class="text-right cell-amount">{{ formatCurrency(item.tongThu) }}</td>
              </tr>
              <tr v-if="!loadingZone && !zoneRevenue.length">
                <td colspan="2" class="empty-row">Chưa có dữ liệu</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="card">
        <div class="card-head">
          <h2 class="card-title">Doanh thu theo nhân viên</h2>
        </div>
        <div class="table-wrap">
          <table class="data-table">
            <thead>
              <tr><th>Nhân viên</th><th class="text-right">Doanh thu</th></tr>
            </thead>
            <tbody>
              <tr v-if="loadingCollector"><td colspan="2"><div class="loading-bar"></div></td></tr>
              <tr v-for="item in collectorRevenue" :key="item.user_id">
                <td class="cell-main">{{ item.hoTen || '—' }}</td>
                <td class="text-right cell-amount">{{ formatCurrency(item.tongThu) }}</td>
              </tr>
              <tr v-if="!loadingCollector && !collectorRevenue.length">
                <td colspan="2" class="empty-row">Chưa có dữ liệu</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import api from '@/api/axios'

const loadingMarket = ref(false)
const loadingZone = ref(false)
const loadingCollector = ref(false)
const exporting = ref(false)

const totalRevenue = ref(0)
const stripeRevenue = ref(0)
const cashRevenue = ref(0)
const marketRevenue = ref<any[]>([])
const zoneRevenue = ref<any[]>([])
const collectorRevenue = ref<any[]>([])

const filters = reactive({
  from: '',
  to: ''
})

onMounted(() => {
  const today = new Date()
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1)
  filters.from = firstDay.toISOString().split('T')[0]
  filters.to = today.toISOString().split('T')[0]
  fetchData()
})

async function fetchData() {
  if (!filters.from || !filters.to) return
  await Promise.all([
    fetchTotalRevenue(),
    fetchStripeRevenue(),
    fetchCashRevenue(),
    fetchMarketRevenue(),
    fetchZoneRevenue(),
    fetchCollectorRevenue()
  ])
}

async function fetchTotalRevenue() {
  try {
    const res = await api.get('/reports/total_revenue', { params: filters })
    totalRevenue.value = res.data?.tongThu || 0
  } catch (error) {
    console.error('Error fetching total revenue:', error)
  }
}

async function fetchStripeRevenue() {
  try {
    const res = await api.get('/reports/stripe', { params: filters })
    stripeRevenue.value = res.data?.tongThuChuyenKhoan || 0
  } catch (error) {
    console.error('Error fetching stripe revenue:', error)
  }
}

async function fetchCashRevenue() {
  try {
    const res = await api.get('/reports/cash', { params: filters })
    cashRevenue.value = res.data?.tongThuTienMat || 0
  } catch (error) {
    console.error('Error fetching cash revenue:', error)
  }
}

async function fetchMarketRevenue() {
  loadingMarket.value = true
  try {
    const res = await api.get('/reports/market', { params: filters })
    marketRevenue.value = res.data || []
  } catch (error) {
    console.error('Error fetching market revenue:', error)
    marketRevenue.value = []
  } finally {
    loadingMarket.value = false
  }
}

async function fetchZoneRevenue() {
  loadingZone.value = true
  try {
    const res = await api.get('/reports/zone', { params: filters })
    zoneRevenue.value = res.data || []
  } catch (error) {
    console.error('Error fetching zone revenue:', error)
    zoneRevenue.value = []
  } finally {
    loadingZone.value = false
  }
}

async function fetchCollectorRevenue() {
  loadingCollector.value = true
  try {
    const res = await api.get('/reports/collector', { params: filters })
    collectorRevenue.value = res.data || []
  } catch (error) {
    console.error('Error fetching collector revenue:', error)
    collectorRevenue.value = []
  } finally {
    loadingCollector.value = false
  }
}

async function exportExcel() {
  exporting.value = true
  try {
    const response = await api.get('/reports/export_excel', {
      params: filters,
      responseType: 'blob'
    })
    const url = window.URL.createObjectURL(new Blob([response.data]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `report_${filters.from}_${filters.to}.xlsx`)
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(url)
  } catch (error) {
    console.error('Error exporting excel:', error)
  } finally {
    exporting.value = false
  }
}

function formatCurrency(value: number) {
  if (value === undefined || value === null) return '0 ₫'
  return new Intl.NumberFormat('vi-VN', { 
    style: 'currency', 
    currency: 'VND',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value)
}
</script>

<style scoped>
.report-page { display: flex; flex-direction: column; gap: 22px; }
.page-header { display: flex; justify-content: space-between; align-items: flex-start; }
.page-title { font-size: 22px; font-weight: 600; color: #1a2e1a; margin: 0 0 4px; letter-spacing: -0.3px; }
.page-sub { font-size: 13px; color: #6b836b; margin: 0; }

.filter-bar { background: white; border: 1px solid #e2ede2; border-radius: 14px; padding: 16px 20px; }
.date-range { display: flex; gap: 16px; align-items: flex-end; flex-wrap: wrap; }
.date-input-wrap { display: flex; flex-direction: column; gap: 6px; }
.date-input-wrap label { font-size: 12px; font-weight: 500; color: #3a4f3a; }
.date-input { height: 40px; padding: 0 12px; border: 1.5px solid #d4e4d4; border-radius: 10px; font-size: 13.5px; font-family: 'Be Vietnam Pro', sans-serif; color: #1a2e1a; background: white; outline: none; }
.date-input:focus { border-color: #3d8c3d; }

.btn-primary { display: inline-flex; align-items: center; gap: 7px; height: 40px; padding: 0 20px; background: #3d8c3d; border: none; border-radius: 10px; color: white; font-size: 13.5px; font-weight: 500; font-family: 'Be Vietnam Pro', sans-serif; cursor: pointer; transition: background 0.15s; }
.btn-primary:hover:not(:disabled) { background: #2d6e2d; }
.btn-primary:disabled { opacity: 0.55; cursor: not-allowed; }

.btn-outline { display: inline-flex; align-items: center; gap: 7px; height: 40px; padding: 0 20px; background: white; border: 1.5px solid #d4e4d4; border-radius: 10px; color: #2d4a2d; font-size: 13px; font-family: 'Be Vietnam Pro', sans-serif; cursor: pointer; transition: background 0.15s; }
.btn-outline:hover:not(:disabled) { background: #f0f7f0; }

.stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
.stat-card { background: white; border: 1px solid #e2ede2; border-radius: 14px; padding: 20px; display: flex; align-items: center; gap: 16px; }
.stat-icon-wrap { width: 52px; height: 52px; border-radius: 14px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.stat-info { flex: 1; }
.stat-val { font-size: 28px; font-weight: 700; color: #1a2e1a; line-height: 1.1; margin-bottom: 4px; }
.stat-lbl { font-size: 13px; color: #6b836b; }

.grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }

.card { background: white; border: 1px solid #e2ede2; border-radius: 14px; overflow: hidden; }
.card-head { padding: 16px 20px; border-bottom: 1px solid #f0f5f0; }
.card-title { font-size: 15px; font-weight: 600; color: #1a2e1a; margin: 0; }

.table-wrap { overflow-x: auto; max-height: 400px; overflow-y: auto; }
.data-table { width: 100%; border-collapse: collapse; }
.data-table th { padding: 12px 16px; font-size: 11.5px; font-weight: 600; color: #94a894; text-transform: uppercase; letter-spacing: 0.05em; text-align: left; background: #fafcfa; border-bottom: 1px solid #f0f5f0; position: sticky; top: 0; }
.data-table td { padding: 12px 16px; border-bottom: 1px solid #f7faf7; vertical-align: middle; }
.data-table tbody tr:last-child td { border-bottom: none; }
.data-table tbody tr:hover td { background: #fafcfa; }

.text-right { text-align: right; }
.cell-main { font-size: 13.5px; font-weight: 500; color: #1a2e1a; }
.cell-amount { font-size: 14px; font-weight: 600; color: #2d6e2d; }

.empty-row { text-align: center; padding: 40px !important; color: #94a894; font-size: 13px; }
.loading-bar { height: 3px; background: linear-gradient(90deg, #eef7ee, #3d8c3d, #eef7ee); background-size: 200%; animation: shimmer 1.5s infinite; border-radius: 2px; }
@keyframes shimmer { to { background-position: -200% center; } }

@media (max-width: 1024px) {
  .stats-grid { grid-template-columns: repeat(2, 1fr); }
  .grid-3 { grid-template-columns: 1fr; }
}
@media (max-width: 768px) {
  .stats-grid { grid-template-columns: 1fr; }
  .date-range { flex-direction: column; align-items: stretch; }
  .date-input-wrap { width: 100%; }
  .date-input { width: 100%; }
}
</style>