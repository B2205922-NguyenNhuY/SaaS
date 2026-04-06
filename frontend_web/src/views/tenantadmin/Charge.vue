<template>
  <div class="page">
    <div class="page-header">
      <div>
        <h1 class="page-title">Khoản thu</h1>
        <p class="page-sub">Danh sách khoản phí theo kỳ thu — tiểu thương và kiosk</p>
      </div>
      <button
        v-if="filters.period_id"
        class="btn-primary"
        @click="openGenerateModal"
        :disabled="generating"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
        Sinh khoản thu
      </button>
    </div>

    <div class="filter-bar">
      <div class="search-wrap">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <input v-model="filters.q" placeholder="Tìm mã kiosk, tiểu thương..." @input="debouncedFetch" />
      </div>
      <select v-model="filters.period_id" @change="fetchData">
        <option value="">Tất cả kỳ thu</option>
        <option v-for="p in periods" :key="p.period_id" :value="p.period_id">{{ p.tenKyThu || `Kỳ #${p.period_id}` }}</option>
      </select>
      <select v-model="filters.trangThai" @change="fetchData">
        <option value="">Tất cả TT</option>
        <option value="chua_thu">Chưa thu</option>
        <option value="no">Nợ</option>
        <option value="da_thu">Đã thu</option>
        <option value="mien">Miễn</option>
      </select>
      <button class="btn-outline" @click="resetFilters">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-4.95"/></svg>
        Reset
      </button>
    </div>

    <div class="stat-cards">
      <div class="stat-card">
        <div class="stat-icon stat-icon--blue">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
        </div>
        <div><div class="stat-label">Tổng khoản thu</div><div class="stat-value">{{ meta.total }}</div></div>
      </div>
      <div class="stat-card">
        <div class="stat-icon stat-icon--amber">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
        </div>
        <div><div class="stat-label">Chưa thu / Nợ</div><div class="stat-value">{{ summary.chuaThu }}</div></div>
      </div>
      <div class="stat-card">
        <div class="stat-icon stat-icon--red">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
        </div>
        <div><div class="stat-label">Tổng phải thu</div><div class="stat-value">{{ fmtMoney(summary.tongPhaiThu) }}</div></div>
      </div>
      <div class="stat-card">
        <div class="stat-icon stat-icon--green">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
        </div>
        <div><div class="stat-label">Đã thu được</div><div class="stat-value">{{ fmtMoney(summary.daThu) }}</div></div>
      </div>
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
              <th>Còn lại</th>
              <th>Trạng thái</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading"><td colspan="8"><div class="loading-bar"></div></td></tr>
            <template v-else>
              <tr v-for="c in items" :key="c.charge_id" class="row-clickable" @click="openDetail(c)">
                <td class="cell-main">{{ c.merchantName }}</td>
                <td><span class="kiosk-code">{{ c.maKiosk }}</span></td>
                <td>
                  <div class="cell-stack">
                    <span class="cell-sub">{{ c.tenKhu }}</span>
                    <span class="cell-sub2">{{ c.tenCho }}</span>
                  </div>
                </td>
                <td class="cell-sub">{{ c.tenKyThu }}</td>
                <td class="cell-money">{{ fmtMoney(c.soTienPhaiThu) }}</td>
                <td class="cell-money cell-money--green">{{ fmtMoney(c.soTienDaThu) }}</td>
                <td class="cell-money" :class="c.soTienConLai > 0 ? 'cell-money--red' : ''">{{ fmtMoney(c.soTienConLai) }}</td>
                <td><span class="badge" :class="chargeStatusClass(c.trangThai)">{{ chargeStatusLabel(c.trangThai) }}</span></td>
              </tr>
              <tr v-if="!items.length">
                <td colspan="8" class="empty-row">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#b0c4b0" stroke-width="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/></svg>
                  <p>Chưa có khoản thu nào</p>
                </td>
              </tr>
            </template>
          </tbody>
        </table>
      </div>
      <div class="table-foot">
        <span class="total-label">{{ meta.total }} khoản thu</span>
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
            <h3>Khoản thu #{{ selected?.charge_id }}</h3>
            <p class="drawer-sub">{{ selected?.merchantName }} — {{ selected?.maKiosk }}</p>
          </div>
          <button class="modal-close" @click="detailDrawer = false">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <div class="drawer-body" v-if="selected">
          <div class="detail-section">
            <div class="detail-section-title">Thông tin khoản thu</div>
            <div class="detail-grid">
              <div class="detail-item"><span class="detail-label">Kỳ thu</span><span class="detail-val">{{ selected.tenKyThu }}</span></div>
              <div class="detail-item"><span class="detail-label">Hình thức phí</span><span class="detail-val">{{ selected.hinhThucApDung === 'ngay' ? 'Theo ngày' : 'Theo tháng' }}</span></div>
              <div class="detail-item"><span class="detail-label">Đơn giá áp dụng</span><span class="detail-val">{{ fmtMoney(selected.donGiaApDung) }}</span></div>
              <div class="detail-item"><span class="detail-label">Miễn giảm</span><span class="detail-val">{{ selected.discountApDung ? selected.discountApDung + '%' : '—' }}</span></div>
            </div>
          </div>

          <div class="detail-section">
            <div class="detail-section-title">Tình trạng thanh toán</div>
            <div class="money-cards">
              <div class="money-card money-card--required">
                <div class="money-card-label">Phải thu</div>
                <div class="money-card-value">{{ fmtMoney(selected.soTienPhaiThu) }}</div>
              </div>
              <div class="money-card money-card--paid">
                <div class="money-card-label">Đã thu</div>
                <div class="money-card-value">{{ fmtMoney(selected.soTienDaThu) }}</div>
              </div>
              <div class="money-card" :class="selected.soTienConLai > 0 ? 'money-card--debt' : 'money-card--done'">
                <div class="money-card-label">Còn lại</div>
                <div class="money-card-value">{{ fmtMoney(selected.soTienConLai) }}</div>
              </div>
            </div>
          </div>

          <div class="detail-section">
            <div class="detail-section-title">Lịch sử thanh toán</div>
            <div v-if="historyLoading" class="loading-bar"></div>
            <div v-else-if="!paymentHistory.length" class="empty-history">Chưa có thanh toán nào</div>
            <div v-else class="history-list">
              <div v-for="h in paymentHistory" :key="h.receipt_id" class="history-item">
                <div class="history-left">
                  <div class="history-amount">{{ fmtMoney(h.soTienDaTra) }}</div>
                  <div class="history-method">
                    <span class="badge" :class="h.hinhThucThanhToan === 'tien_mat' ? 'badge--amber' : 'badge--blue'">
                      {{ h.hinhThucThanhToan === 'tien_mat' ? 'Tiền mặt' : 'Chuyển khoản' }}
                    </span>
                  </div>
                </div>
                <div class="history-right">
                  <div class="history-date">{{ fmtDt(h.thoiGianThu) }}</div>
                  <div class="history-note" v-if="h.ghiChu">{{ h.ghiChu }}</div>
                </div>
              </div>
            </div>
          </div>

          <div class="detail-section" v-if="selected.trangThai === 'chua_thu' || selected.trangThai === 'no'">
            <div class="detail-section-title">Thao tác</div>
            <button class="btn-exempt" @click="exemptCharge(selected)" :disabled="saving">
              Miễn khoản thu này
            </button>
          </div>
        </div>
      </div>
    </div>

    <Teleport to="body">
      <div v-if="generateModal" class="modal-overlay" @click.self="generateModal = false">
        <div class="modal modal--sm">
          <div class="modal-header">
            <h3>Sinh khoản thu</h3>
            <button class="modal-close" @click="generateModal = false">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
          <div class="modal-body">
            <div class="info-note">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              <span>Hệ thống sẽ tự động sinh khoản thu cho <strong>tất cả kiosk đang có tiểu thương thuê</strong> và đã gán biểu phí trong kỳ thu đang chọn. Kiosk đã có khoản thu sẽ được bỏ qua.</span>
            </div>
            <div class="field">
              <label>Kỳ thu</label>
              <input :value="selectedPeriodName" disabled />
            </div>
            <div class="error-banner" v-if="generateError">{{ generateError }}</div>
            <div class="success-banner" v-if="generateResult">{{ generateResult }}</div>
          </div>
          <div class="modal-footer">
            <button class="btn-ghost" @click="generateModal = false">Đóng</button>
            <button class="btn-primary" @click="doGenerate" :disabled="generating" v-if="!generateResult">
              <span v-if="generating" class="spin"></span>
              {{ generating ? 'Đang sinh...' : 'Xác nhận sinh phí' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import api from '@/api/axios'

const route = useRoute()
const loading        = ref(true)
const saving         = ref(false)
const generating     = ref(false)
const historyLoading = ref(false)
const detailDrawer   = ref(false)
const generateModal  = ref(false)
const selected       = ref<any>(null)
const items          = ref<any[]>([])
const meta           = ref({ total: 0, totalPages: 1 })
const pg             = reactive({ page: 1, limit: 10 })
const periods        = ref<any[]>([])
const paymentHistory = ref<any[]>([])
const generateError  = ref('')
const generateResult = ref('')

const filters = reactive({
  q: '', period_id: route.query.period_id ? Number(route.query.period_id) : '' as any, trangThai: '',
})
const summary = reactive({ chuaThu: 0, tongPhaiThu: 0, daThu: 0 })

const selectedPeriodName = computed(() => {
  if (!filters.period_id) return ''
  const p = periods.value.find(x => x.period_id == filters.period_id)
  return p?.tenKyThu || `Kỳ #${filters.period_id}`
})

let debounceTimer: any
function debouncedFetch() { clearTimeout(debounceTimer); debounceTimer = setTimeout(() => { pg.page = 1; fetchData() }, 400) }

onMounted(async () => {
  await api.get('/collection_periods', { params: { limit: 100 } })
    .then(r => periods.value = r.data.data || []).catch(() => {})
  fetchData()
})

async function fetchData() {
  loading.value = true
  try {
    const p: any = { page: pg.page, limit: pg.limit }
    if (filters.q)         p.q         = filters.q
    if (filters.period_id) p.period_id = filters.period_id
    if (filters.trangThai) p.trangThai = filters.trangThai
    const res = await api.get('/charges', { params: p })
    items.value = res.data.data || []
    meta.value  = res.data.meta || { total: 0, totalPages: 1 }
    summary.chuaThu     = items.value.filter(x => x.trangThai === 'chua_thu' || x.trangThai === 'no').length
    summary.tongPhaiThu = items.value.reduce((s, x) => s + Number(x.soTienPhaiThu || 0), 0)
    summary.daThu       = items.value.reduce((s, x) => s + Number(x.soTienDaThu || 0), 0)
  } catch { items.value = [] }
  finally { loading.value = false }
}

function resetFilters() { filters.q = ''; filters.period_id = ''; filters.trangThai = ''; pg.page = 1; fetchData() }
function changePage(p: number) { pg.page = p; fetchData() }

async function openDetail(c: any) {
  selected.value = c
  detailDrawer.value = true
  paymentHistory.value = []
  historyLoading.value = true
  try {
    const r = await api.get(`/charges/history/${c.charge_id}`)
    paymentHistory.value = r.data || []
  } catch { paymentHistory.value = [] }
  finally { historyLoading.value = false }
}

async function exemptCharge(c: any) {
  if (!confirm('Miễn khoản thu này?')) return
  saving.value = true
  try {
    await api.patch(`/charges/${c.charge_id}/status`, { trangThai: 'mien' })
    c.trangThai = 'mien'; detailDrawer.value = false; fetchData()
  } catch (e: any) { alert(e.response?.data?.message || 'Lỗi') }
  finally { saving.value = false }
}

function openGenerateModal() {
  generateError.value = ''; generateResult.value = ''; generateModal.value = true
}

async function doGenerate() {
  if (!filters.period_id) return
  generating.value = true; generateError.value = ''
  try {
    const res = await api.post('/charges/generate', { period_id: Number(filters.period_id) })
    generateResult.value = `✅ ${res.data.message || `Đã sinh ${res.data.count} khoản thu`}`
    fetchData()
  } catch (e: any) {
    generateError.value = e.response?.data?.message || 'Lỗi khi sinh phí'
  } finally { generating.value = false }
}

function chargeStatusClass(s: string) {
  return { chua_thu: 'badge--amber', no: 'badge--red', da_thu: 'badge--green', mien: 'badge--gray' }[s] || 'badge--gray'
}
function chargeStatusLabel(s: string) {
  return { chua_thu: 'Chưa thu', no: 'Nợ', da_thu: 'Đã thu', mien: 'Miễn' }[s] || s
}
function fmtMoney(n: any) { return Number(n || 0).toLocaleString('vi-VN', { style: 'currency', currency: 'VND' }) }
function fmtDt(d: string) { return d ? new Date(d).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' }) : '—' }
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
.stat-cards { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
.stat-card { background: white; border: 1px solid #e2ede2; border-radius: 12px; padding: 16px; display: flex; align-items: center; gap: 14px; }
.stat-icon { width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.stat-icon--blue  { background: #eff6ff; color: #1d4ed8; }
.stat-icon--amber { background: #fffbeb; color: #b45309; }
.stat-icon--red   { background: #fef2f2; color: #dc2626; }
.stat-icon--green { background: #eef7ee; color: #3d8c3d; }
.stat-label { font-size: 11.5px; color: #6b836b; margin-bottom: 3px; }
.stat-value { font-size: 16px; font-weight: 600; color: #1a2e1a; }
.table-panel { background: white; border: 1px solid #e2ede2; border-radius: 14px; overflow: hidden; }
.table-wrap { overflow-x: auto; }
.data-table { width: 100%; border-collapse: collapse; }
.data-table th { padding: 11px 14px; font-size: 11px; font-weight: 600; color: #94a894; text-transform: uppercase; letter-spacing: .06em; text-align: left; background: #fafcfa; border-bottom: 1px solid #f0f5f0; white-space: nowrap; }
.data-table td { padding: 13px 14px; border-bottom: 1px solid #f7faf7; vertical-align: middle; }
.row-clickable { cursor: pointer; }
.data-table tbody tr.row-clickable:hover td { background: #fafcfa; }
.data-table tbody tr:last-child td { border-bottom: none; }
.cell-main { font-size: 13.5px; font-weight: 500; color: #1a2e1a; }
.cell-sub { font-size: 12.5px; color: #6b836b; }
.cell-sub2 { font-size: 11.5px; color: #94a894; }
.cell-stack { display: flex; flex-direction: column; gap: 1px; }
.cell-money { font-size: 13px; font-weight: 500; color: #1a2e1a; white-space: nowrap; }
.cell-money--green { color: #2d6e2d; }
.cell-money--red   { color: #dc2626; }
.kiosk-code { font-size: 12.5px; font-weight: 600; background: #f0f5f0; padding: 2px 7px; border-radius: 5px; font-family: monospace; color: #1a2e1a; }
.badge { display: inline-flex; align-items: center; padding: 3px 9px; border-radius: 20px; font-size: 11.5px; font-weight: 500; }
.badge--green { background: #eef7ee; color: #2d6e2d; }
.badge--amber { background: #fffbeb; color: #b45309; }
.badge--red   { background: #fef2f2; color: #dc2626; }
.badge--gray  { background: #f4f4f4; color: #6b7280; }
.badge--blue  { background: #eff6ff; color: #1d4ed8; }
.empty-row { text-align: center; padding: 48px 16px !important; color: #94a894; }
.empty-row p { margin: 8px 0 0; font-size: 13px; }
.loading-bar { height: 3px; background: linear-gradient(90deg,#eef7ee,#3d8c3d,#eef7ee); background-size: 200%; animation: shimmer 1.5s infinite; border-radius: 2px; }
@keyframes shimmer { to { background-position: -200% center; } }
.table-foot { display: flex; justify-content: space-between; align-items: center; padding: 12px 16px; border-top: 1px solid #f0f5f0; }
.total-label { font-size: 12.5px; color: #94a894; }
.pagination { display: flex; align-items: center; gap: 10px; }
.pagination button { height: 32px; padding: 0 14px; background: white; border: 1px solid #e2ede2; border-radius: 8px; cursor: pointer; font-size: 12.5px; font-family: 'Be Vietnam Pro', sans-serif; color: #4a654a; }
.pagination button:hover:not(:disabled) { background: #f0f7f0; }
.pagination button:disabled { opacity: 0.4; cursor: not-allowed; }
.pagination span { font-size: 12.5px; color: #6b836b; }
.btn-primary { display: inline-flex; align-items: center; gap: 7px; height: 40px; padding: 0 18px; background: #3d8c3d; border: none; border-radius: 10px; color: white; font-size: 13.5px; font-weight: 500; font-family: 'Be Vietnam Pro', sans-serif; cursor: pointer; transition: background .15s; }
.btn-primary:hover:not(:disabled) { background: #2d6e2d; }
.btn-primary:disabled { opacity: 0.55; cursor: not-allowed; }
.btn-outline { display: inline-flex; align-items: center; gap: 6px; height: 38px; padding: 0 14px; background: white; border: 1.5px solid #d4e4d4; border-radius: 10px; color: #4a654a; font-size: 13px; font-family: 'Be Vietnam Pro', sans-serif; cursor: pointer; }
.btn-outline:hover { background: #f0f7f0; }
.btn-ghost { height: 40px; padding: 0 18px; background: none; border: 1px solid #e2ede2; border-radius: 10px; color: #4a654a; font-size: 13.5px; font-family: 'Be Vietnam Pro', sans-serif; cursor: pointer; }
.btn-ghost:hover { background: #f7faf7; }
.btn-exempt { width: 100%; height: 38px; background: white; border: 1.5px solid #fecaca; border-radius: 10px; color: #dc2626; font-size: 13px; font-family: 'Be Vietnam Pro', sans-serif; cursor: pointer; transition: background .15s; }
.btn-exempt:hover:not(:disabled) { background: #fef2f2; }
.btn-exempt:disabled { opacity: 0.55; cursor: not-allowed; }
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
.detail-item { display: flex; flex-direction: column; gap: 3px; }
.detail-label { font-size: 11.5px; color: #94a894; }
.detail-val { font-size: 13.5px; color: #1a2e1a; font-weight: 500; }
.money-cards { display: flex; flex-direction: column; gap: 8px; }
.money-card { border-radius: 10px; padding: 12px 16px; display: flex; justify-content: space-between; align-items: center; }
.money-card--required { background: #f7faf7; border: 1px solid #e2ede2; }
.money-card--paid     { background: #f0fdf4; border: 1px solid #bbf7d0; }
.money-card--debt     { background: #fef2f2; border: 1px solid #fecaca; }
.money-card--done     { background: #eef7ee; border: 1px solid #d4e4d4; }
.money-card-label { font-size: 13px; color: #4a654a; }
.money-card-value { font-size: 15px; font-weight: 600; color: #1a2e1a; }
.history-list { display: flex; flex-direction: column; gap: 6px; }
.history-item { display: flex; justify-content: space-between; align-items: flex-start; background: #f7faf7; border-radius: 10px; padding: 11px 14px; gap: 12px; }
.history-left { display: flex; flex-direction: column; gap: 4px; }
.history-amount { font-size: 14px; font-weight: 600; color: #2d6e2d; }
.history-right { display: flex; flex-direction: column; align-items: flex-end; gap: 3px; }
.history-date { font-size: 12px; color: #6b836b; white-space: nowrap; }
.history-note { font-size: 11.5px; color: #94a894; }
.empty-history { font-size: 13px; color: #94a894; padding: 4px 0; }
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 1rem; }
.modal { background: white; border-radius: 16px; width: 100%; max-width: 460px; max-height: 90vh; overflow-y: auto; box-shadow: 0 20px 60px rgba(0,0,0,0.15); }
.modal--sm { max-width: 400px; }
.modal-header { display: flex; justify-content: space-between; align-items: center; padding: 18px 22px 14px; border-bottom: 1px solid #f0f5f0; }
.modal-header h3 { font-size: 15px; font-weight: 600; color: #1a2e1a; margin: 0; }
.modal-body { padding: 18px 22px; display: flex; flex-direction: column; gap: 14px; }
.modal-footer { display: flex; justify-content: flex-end; gap: 10px; padding: 14px 22px; border-top: 1px solid #f0f5f0; }
.field { display: flex; flex-direction: column; gap: 5px; }
.field label { font-size: 12.5px; font-weight: 500; color: #3a4f3a; }
.field input { width: 100%; height: 40px; padding: 0 12px; border: 1.5px solid #d4e4d4; border-radius: 10px; font-size: 13.5px; font-family: 'Be Vietnam Pro', sans-serif; color: #1a2e1a; background: #f5f8f5; outline: none; }
.info-note { display: flex; align-items: flex-start; gap: 8px; background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 10px 13px; font-size: 12.5px; color: #1e40af; line-height: 1.55; }
.info-note svg { flex-shrink: 0; margin-top: 1px; }
.error-banner { background: #fef2f2; border: 1px solid #fecaca; border-radius: 9px; padding: 10px 14px; color: #b91c1c; font-size: 13px; }
.success-banner { background: #eef7ee; border: 1px solid #d4e4d4; border-radius: 9px; padding: 10px 14px; color: #2d6e2d; font-size: 13px; }
.spin { width: 14px; height: 14px; border: 2px solid rgba(255,255,255,.35); border-top-color: white; border-radius: 50%; animation: spin .65s linear infinite; display: inline-block; }
@keyframes spin { to { transform: rotate(360deg); } }
@media (max-width: 900px) { .stat-cards { grid-template-columns: repeat(2, 1fr); } }
</style>