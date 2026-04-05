<template>
  <div class="page">
    <div class="page-header">
      <div>
        <h1 class="page-title">Công nợ</h1>
      </div>
    </div>

    <div class="debt-summary" v-if="totalDebt !== null">
      <div class="debt-summary-main">
        <div class="debt-summary-label">Tổng công nợ hiện tại</div>
        <div class="debt-summary-value">{{ fmtMoney(totalDebt) }}</div>
      </div>
      <div class="debt-summary-sub">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
        {{ meta.total }} khoản nợ từ tiểu thương
      </div>
    </div>

    <div class="section-block" v-if="topDebtors.length">
      <div class="section-block-title">Top tiểu thương nợ nhiều nhất</div>
      <div class="debtor-list">
        <div v-for="(d, i) in topDebtors" :key="d.merchant_id" class="debtor-item">
          <div class="debtor-rank" :class="`rank-${i+1}`">{{ i + 1 }}</div>
          <div class="debtor-info">
            <div class="debtor-name">{{ d.hoTen }}</div>
            <div class="debtor-meta">{{ d.soKioskNo }} kiosk nợ</div>
          </div>
          <div class="debtor-amount">{{ fmtMoney(d.tongNo) }}</div>
        </div>
      </div>
    </div>

    <div class="filter-bar">
      <div class="search-wrap">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <input v-model="filters.q" placeholder="Tìm tiểu thương, kiosk, kỳ thu..." @input="debouncedFetch" />
      </div>
      <select v-model="filters.market_id" @change="fetchData">
        <option value="">Tất cả chợ</option>
        <option v-for="m in markets" :key="m.market_id" :value="m.market_id">{{ m.tenCho }}</option>
      </select>
      <button class="btn-outline" @click="resetFilters">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-4.95"/></svg>
        Reset
      </button>
    </div>

    <div class="table-panel">
      <div class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>Tiểu thương</th>
              <th>Kiosk</th>
              <th>Khu / Chợ</th>
              <th>Kỳ thu</th>
              <th>Phải thu</th>
              <th>Đã thu</th>
              <th>Còn nợ</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading"><td colspan="7"><div class="loading-bar"></div></td></tr>
            <template v-else>
              <tr v-for="d in items" :key="d.charge_id">
                <td>
                  <div class="cell-with-avatar">
                    <div class="m-avatar">{{ initials(d.hoTen) }}</div>
                    <div class="cell-main">{{ d.hoTen }}</div>
                  </div>
                </td>
                <td><span class="kiosk-code">{{ d.maKiosk }}</span></td>
                <td>
                  <div class="cell-stack">
                    <span class="cell-sub">{{ d.tenKhu }}</span>
                  </div>
                </td>
                <td class="cell-sub">{{ d.tenKyThu }}</td>
                <td class="cell-money">{{ fmtMoney(d.soTienPhaiThu) }}</td>
                <td class="cell-money cell-money--green">{{ fmtMoney(d.soTienDaThu) }}</td>
                <td class="cell-money cell-money--red"><strong>{{ fmtMoney(d.soTienNo) }}</strong></td>
              </tr>
              <tr v-if="!items.length">
                <td colspan="7" class="empty-row">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#b0c4b0" stroke-width="1.5"><polyline points="20 6 9 17 4 12"/></svg>
                  <p>Không có công nợ!</p>
                </td>
              </tr>
            </template>
          </tbody>
        </table>
      </div>
      <div class="table-foot">
        <span class="total-label">{{ meta.total }} khoản nợ</span>
        <div class="pagination" v-if="meta.totalPages > 1">
          <button :disabled="pg.page <= 1" @click="changePage(pg.page-1)">← Trước</button>
          <span>{{ pg.page }} / {{ meta.totalPages }}</span>
          <button :disabled="pg.page >= meta.totalPages" @click="changePage(pg.page+1)">Tiếp →</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import api from '@/api/axios'

const loading    = ref(true)
const items      = ref<any[]>([])
const meta       = ref({ total: 0, totalPages: 1 })
const pg         = reactive({ page: 1, limit: 10 })
const filters    = reactive({ q: '', market_id: '' })
const markets    = ref<any[]>([])
const topDebtors = ref<any[]>([])
const totalDebt  = ref<number | null>(null)

let debounceTimer: any
function debouncedFetch() { clearTimeout(debounceTimer); debounceTimer = setTimeout(() => { pg.page = 1; fetchData() }, 400) }

onMounted(async () => {
  await Promise.all([
    api.get('/market', { params: { limit: 200 } }).then(r => markets.value = r.data.data || []).catch(() => {}),
    api.get('/debts/total').then(r => totalDebt.value = Number(r.data.tongNo || 0)).catch(() => {}),
    api.get('/debts/top').then(r => topDebtors.value = r.data || []).catch(() => {}),
  ])
  fetchData()
})

async function fetchData() {
  loading.value = true
  try {
    const p: any = { page: pg.page, limit: pg.limit }
    if (filters.q)         p.q         = filters.q
    if (filters.market_id) p.market_id = filters.market_id
    const res = await api.get('/debts', { params: p })
    items.value = res.data.data || []
    meta.value  = res.data.meta || { total: 0, totalPages: 1 }
  } catch { items.value = [] }
  finally { loading.value = false }
}

function resetFilters() { filters.q = ''; filters.market_id = ''; pg.page = 1; fetchData() }
function changePage(p: number) { pg.page = p; fetchData() }
function fmtMoney(n: any) { return Number(n || 0).toLocaleString('vi-VN', { style: 'currency', currency: 'VND' }) }
function initials(n: string) { return (n || '?').split(' ').map((w: string) => w[0]).slice(-2).join('').toUpperCase() }
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@300;400;500;600&display=swap');
*, *::before, *::after { box-sizing: border-box; }
.page { display: flex; flex-direction: column; gap: 18px; font-family: 'Be Vietnam Pro', sans-serif; }
.page-header { display: flex; justify-content: space-between; align-items: flex-start; }
.page-title { font-size: 22px; font-weight: 600; color: #1a2e1a; margin: 0 0 4px; }
.page-sub { font-size: 13px; color: #6b836b; margin: 0; }

.debt-summary { background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); border-radius: 14px; padding: 22px 24px; color: white; }
.debt-summary-label { font-size: 13px; opacity: 0.85; margin-bottom: 6px; }
.debt-summary-value { font-size: 32px; font-weight: 700; margin-bottom: 8px; }
.debt-summary-sub { display: flex; align-items: center; gap: 7px; font-size: 13px; opacity: 0.8; }

.section-block { background: white; border: 1px solid #e2ede2; border-radius: 14px; padding: 18px 20px; }
.section-block-title { font-size: 13px; font-weight: 600; color: #1a2e1a; margin-bottom: 14px; }
.debtor-list { display: flex; flex-direction: column; gap: 8px; }
.debtor-item { display: flex; align-items: center; gap: 12px; padding: 10px 12px; background: #f7faf7; border-radius: 10px; }
.debtor-rank { width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 700; flex-shrink: 0; }
.rank-1 { background: #fef3c7; color: #92400e; }
.rank-2 { background: #f3f4f6; color: #374151; }
.rank-3 { background: #fef2f2; color: #b45309; }
.debtor-info { flex: 1; }
.debtor-name { font-size: 13.5px; font-weight: 500; color: #1a2e1a; }
.debtor-meta { font-size: 11.5px; color: #6b836b; }
.debtor-amount { font-size: 14px; font-weight: 600; color: #dc2626; white-space: nowrap; }

.filter-bar { display: flex; gap: 10px; flex-wrap: wrap; align-items: center; }
.search-wrap { flex: 1; min-width: 180px; max-width: 280px; position: relative; display: flex; align-items: center; }
.search-wrap svg { position: absolute; left: 11px; color: #94a894; pointer-events: none; }
.search-wrap input { width: 100%; height: 38px; padding: 0 12px 0 33px; border: 1.5px solid #d4e4d4; border-radius: 10px; font-size: 13px; font-family: 'Be Vietnam Pro', sans-serif; color: #1a2e1a; background: white; outline: none; }
.search-wrap input:focus { border-color: #3d8c3d; }
select { height: 38px; padding: 0 10px; border: 1.5px solid #d4e4d4; border-radius: 10px; font-size: 13px; font-family: 'Be Vietnam Pro', sans-serif; color: #1a2e1a; background: white; outline: none; }
.btn-outline { display: inline-flex; align-items: center; gap: 6px; height: 38px; padding: 0 14px; background: white; border: 1.5px solid #d4e4d4; border-radius: 10px; color: #4a654a; font-size: 13px; font-family: 'Be Vietnam Pro', sans-serif; cursor: pointer; }
.btn-outline:hover { background: #f0f7f0; }
.table-panel { background: white; border: 1px solid #e2ede2; border-radius: 14px; overflow: hidden; }
.table-wrap { overflow-x: auto; }
.data-table { width: 100%; border-collapse: collapse; }
.data-table th { padding: 11px 14px; font-size: 11px; font-weight: 600; color: #94a894; text-transform: uppercase; letter-spacing: .06em; text-align: left; background: #fafcfa; border-bottom: 1px solid #f0f5f0; white-space: nowrap; }
.data-table td { padding: 13px 14px; border-bottom: 1px solid #f7faf7; vertical-align: middle; }
.data-table tbody tr:hover td { background: #fafcfa; }
.data-table tbody tr:last-child td { border-bottom: none; }
.cell-with-avatar { display: flex; align-items: center; gap: 9px; }
.m-avatar { width: 30px; height: 30px; background: #7c3aed; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 700; color: white; flex-shrink: 0; }
.cell-main { font-size: 13.5px; font-weight: 500; color: #1a2e1a; }
.cell-sub { font-size: 12.5px; color: #6b836b; }
.cell-stack { display: flex; flex-direction: column; gap: 1px; }
.cell-money { font-size: 13px; font-weight: 500; color: #1a2e1a; white-space: nowrap; }
.cell-money--green { color: #2d6e2d; }
.cell-money--red { color: #dc2626; }
.kiosk-code { font-size: 12.5px; font-weight: 600; background: #f0f5f0; padding: 2px 7px; border-radius: 5px; font-family: monospace; color: #1a2e1a; }
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
</style>