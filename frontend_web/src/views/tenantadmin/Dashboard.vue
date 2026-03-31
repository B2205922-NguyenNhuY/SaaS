<template>
  <div class="dashboard">
    <div class="page-header">
      <div>
        <h1 class="page-title">Tổng quan</h1>
        <p class="page-sub">Xin chào, <strong>{{ authStore.user?.hoTen || 'Tenant Admin' }}</strong> · {{ today }}</p>
      </div>
      <button class="btn-outline" @click="loadAll" :class="{ spinning: loading }">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
        Làm mới
      </button>
    </div>

    <div class="stats-grid">
      <div class="stat-card" @click="$router.push('/tenant-admin/markets')">
        <div class="stat-icon-wrap" style="background:#eef7ee">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3d8c3d" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
        </div>
        <div class="stat-info">
          <div class="stat-val"><span v-if="loading" class="sk-num"></span><span v-else>{{ stats.totalMarkets }}</span></div>
          <div class="stat-lbl">Tổng chợ</div>
        </div>
      </div>
      <div class="stat-card" @click="$router.push('/tenant-admin/kiosks')">
        <div class="stat-icon-wrap" style="background:#eff6ff">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></svg>
        </div>
        <div class="stat-info">
          <div class="stat-val"><span v-if="loading" class="sk-num"></span><span v-else>{{ stats.totalKiosks }}</span></div>
          <div class="stat-lbl">Tổng Kiosk</div>
        </div>
      </div>
      <div class="stat-card" @click="$router.push('/tenant-admin/merchants')">
        <div class="stat-icon-wrap" style="background:#f5f3ff">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
        </div>
        <div class="stat-info">
          <div class="stat-val"><span v-if="loading" class="sk-num"></span><span v-else>{{ stats.totalMerchants }}</span></div>
          <div class="stat-lbl">Tiểu thương</div>
        </div>
      </div>
      <div class="stat-card" @click="$router.push('/tenant-admin/debts')">
        <div class="stat-icon-wrap" style="background:#fef2f2">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#dc2626" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
        </div>
        <div class="stat-info">
          <div class="stat-val stat-val--red"><span v-if="loading" class="sk-num"></span><span v-else>{{ fmtMoney(stats.tongNo) }}</span></div>
          <div class="stat-lbl">Tổng công nợ</div>
        </div>
      </div>
    </div>

    <div class="card chart-card">
      <div class="card-head">
        <h2 class="card-title">Hoạt động 7 ngày qua</h2>
        <div class="chart-legend">
          <span class="legend-dot" style="background:#3d8c3d"></span>
          <span class="legend-text">Số lượng hành động</span>
        </div>
      </div>
      <div class="chart-container">
        <canvas ref="chartCanvas" height="300"></canvas>
      </div>
    </div>

    <div class="grid-2">
      <div class="card card--revenue">
        <div class="card-head">
          <h2 class="card-title">Thu tiền mặt tháng này</h2>
          <router-link to="/tenant-admin/receipts" class="see-all">Xem phiếu thu →</router-link>
        </div>
        <div class="revenue-big">{{ fmtMoney(stats.thuThangNay) }}</div>
        <div class="revenue-sub"><strong>{{ stats.soPhieuThu }}</strong> phiếu thu trong tháng {{ currentMonth }}</div>
      </div>

      <div class="card">
        <div class="card-head">
          <h2 class="card-title">Ca làm việc hôm nay</h2>
          <router-link to="/tenant-admin/shifts" class="see-all">Xem tất cả →</router-link>
        </div>
        <div v-if="loading" class="sk-rows"><div v-for="i in 3" :key="i" class="sk-row"></div></div>
        <div v-else-if="!todayShifts.length" class="empty">Không có ca nào hôm nay</div>
        <div v-else class="activity">
          <div v-for="s in todayShifts" :key="s.shift_id" class="act-item">
            <div class="act-avatar">{{ initials(s.hoTen) }}</div>
            <div class="act-body">
              <div class="act-name">{{ s.hoTen }}</div>
              <div class="act-meta">{{ fmtTime(s.thoiGianBatDauCa) }} · {{ fmtMoney(s.tongTienMatThuDuoc) }}</div>
            </div>
            <span class="badge" :class="s.thoiGianKetThucCa ? 'badge-gray' : 'badge-blue'">
              <span v-if="!s.thoiGianKetThucCa" class="dot-live"></span>
              {{ s.thoiGianKetThucCa ? 'Đã đóng' : 'Đang mở' }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <div class="grid-2">
      <div class="card">
        <div class="card-head">
          <h2 class="card-title">Khoản thu chưa thu</h2>
          <router-link to="/tenant-admin/charges" class="see-all">Xem tất cả →</router-link>
        </div>
        <div v-if="loading" class="sk-rows"><div v-for="i in 4" :key="i" class="sk-row"></div></div>
        <div v-else-if="!pendingCharges.length" class="empty">Không có khoản thu tồn đọng</div>
        <table v-else class="tbl">
          <thead><tr><th>Tiểu thương</th><th>Kiosk</th><th>Còn lại</th><th>TT</th></tr></thead>
          <tbody>
            <tr v-for="c in pendingCharges" :key="c.charge_id">
              <td class="cell-name">{{ c.merchantName }}</td>
              <td><span class="kiosk-tag">{{ c.maKiosk }}</span></td>
              <td class="cell-money-red">{{ fmtMoney(c.soTienPhaiThu - c.soTienDaThu) }}</td>
              <td><span class="badge" :class="c.trangThai === 'no' ? 'badge-red' : 'badge-amber'">{{ c.trangThai === 'no' ? 'Nợ' : 'Chưa thu' }}</span></td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="card">
        <div class="card-head">
          <h2 class="card-title">Top nợ nhiều nhất</h2>
          <router-link to="/tenant-admin/debts" class="see-all">Xem chi tiết →</router-link>
        </div>
        <div v-if="loading" class="sk-rows"><div v-for="i in 4" :key="i" class="sk-row"></div></div>
        <div v-else-if="!topDebtors.length" class="empty">Không có công nợ nào</div>
        <div v-else class="activity">
          <div v-for="(d, i) in topDebtors.slice(0,5)" :key="d.merchant_id" class="act-item">
            <div class="debtor-rank" :class="`rank-${Math.min(i+1,3)}`">{{ i+1 }}</div>
            <div class="act-body">
              <div class="act-name">{{ d.hoTen }}</div>
              <div class="act-meta">{{ d.soKioskNo }} kiosk nợ</div>
            </div>
            <div class="debtor-amount">{{ fmtMoney(d.tongNo) }}</div>
          </div>
        </div>
      </div>
    </div>

    <div class="grid-2">
      <div class="card">
        <div class="card-head">
          <h2 class="card-title">Hoạt động gần đây</h2>
          <router-link to="/tenant-admin/audit-logs" class="see-all">Xem log →</router-link>
        </div>
        <div v-if="loading" class="sk-rows"><div v-for="i in 5" :key="i" class="sk-row"></div></div>
        <div v-else-if="!auditLogs.length" class="empty">Chưa có hoạt động nào</div>
        <div v-else class="activity">
          <div v-for="l in auditLogs" :key="l.log_id" class="act-item">
            <div class="act-dot" :class="dotClass(l.hanhDong)"></div>
            <div class="act-body">
              <div class="act-name">{{ formatAction(l.hanhDong) }}</div>
              <div class="act-meta">{{ l.performer_name || l.performer_email || 'Hệ thống' }} · {{ fmtDt(l.thoiGianThucHien) }}</div>
            </div>
          </div>
        </div>
      </div>

      <div class="card card--plan">
        <div class="card-head">
          <h2 class="card-title">Gói cước hiện tại</h2>
          <router-link to="/tenant-admin/plans" class="see-all">Quản lý →</router-link>
        </div>
        <div v-if="!planInfo" class="empty">Chưa có gói cước</div>
        <div v-else class="plan-body">
          <div class="plan-name">{{ planInfo.tenGoi }}</div>
          <div class="plan-price">{{ fmtMoney(planInfo.giaTien) }}<span>/tháng</span></div>
          <div class="plan-limits">
            <div class="plan-limit">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>
              {{ stats.totalMarkets }} / {{ planInfo.gioiHanSoCho }} chợ
              <div class="limit-bar"><div class="limit-fill" :style="{ width: Math.min(100, stats.totalMarkets/planInfo.gioiHanSoCho*100)+'%' }"></div></div>
            </div>
            <div class="plan-limit">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></svg>
              {{ stats.totalKiosks }} / {{ planInfo.gioiHanSoKiosk }} kiosk
              <div class="limit-bar"><div class="limit-fill" :style="{ width: Math.min(100, stats.totalKiosks/planInfo.gioiHanSoKiosk*100)+'%' }"></div></div>
            </div>
            <div class="plan-limit">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
              {{ stats.totalMerchants }} / {{ planInfo.gioiHanUser }} user
              <div class="limit-bar"><div class="limit-fill" :style="{ width: Math.min(100, stats.totalMerchants/planInfo.gioiHanUser*100)+'%' }"></div></div>
            </div>
          </div>
          <div class="plan-expiry" v-if="planInfo.ngayKetThuc">Hết hạn: <strong>{{ fmtDate(planInfo.ngayKetThuc) }}</strong></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import api from '@/api/axios'
import Chart from 'chart.js/auto'

const router      = useRouter()
const authStore   = useAuthStore()
const loading     = ref(true)
const chartCanvas = ref<HTMLCanvasElement | null>(null)
let chartInstance: Chart | null = null

const now          = new Date()
const today        = now.toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })
const currentMonth = `${now.getMonth() + 1}/${now.getFullYear()}`

const stats = ref({ totalMarkets: 0, totalKiosks: 0, occupiedKiosks: 0, availableKiosks: 0, totalMerchants: 0, tongNo: 0, soKhoanNo: 0, thuThangNay: 0, soPhieuThu: 0 })
const planInfo       = ref<any>(null)
const todayShifts    = ref<any[]>([])
const pendingCharges = ref<any[]>([])
const topDebtors     = ref<any[]>([])
const auditLogs      = ref<any[]>([])
let allAuditLogs: any[] = []

onMounted(() => loadAll())

async function loadAll() {
  loading.value = true
  await Promise.allSettled([
    loadMarkets(), loadKiosks(), loadMerchants(),
    loadDebt(), loadReceipts(), loadShifts(),
    loadCharges(), loadPlan(), loadTopDebtors(), loadAuditLog(),
  ])
  loading.value = false
  await nextTick()
  renderChart()
}

async function loadMarkets() {
  const r = await api.get('/market', { params: { limit: 1 } })
  stats.value.totalMarkets = r.data.meta?.total || 0
}
async function loadKiosks() {
  const [all, occ, avail] = await Promise.all([
    api.get('/kiosk', { params: { limit: 1 } }),
    api.get('/kiosk', { params: { limit: 1, trangThai: 'occupied' } }),
    api.get('/kiosk', { params: { limit: 1, trangThai: 'available' } }),
  ])
  stats.value.totalKiosks     = all.data.meta?.total || 0
  stats.value.occupiedKiosks  = occ.data.meta?.total || 0
  stats.value.availableKiosks = avail.data.meta?.total || 0
}
async function loadMerchants() {
  const r = await api.get('/merchant', { params: { limit: 1, trangThai: 'active' } })
  stats.value.totalMerchants = r.data.meta?.total || 0
}
async function loadDebt() {
  const [total, list] = await Promise.all([api.get('/debts/total'), api.get('/debts', { params: { limit: 1 } })])
  stats.value.tongNo    = Number(total.data.tongNo || 0)
  stats.value.soKhoanNo = list.data.meta?.total || 0
}
async function loadReceipts() {
  const from = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-01`
  const r = await api.get('/receipts', { params: { limit: 100, from_date: from } })
  const rows = r.data.data || []
  stats.value.soPhieuThu  = r.data.meta?.total || rows.length
  stats.value.thuThangNay = rows.reduce((s: number, x: any) => s + Number(x.soTienThu || 0), 0)
}
async function loadShifts() {
  const todayStr = now.toISOString().split('T')[0];
  const r = await api.get('/shifts', { 
    params: { 
      limit: 10, 
      from_date: todayStr, 
      to_date: todayStr,
      status: 'open' 
    } 
  });
  if (!r.data.data.length) {
    const openShifts = await api.get('/shifts', { params: { limit: 10, is_open: true } });
    todayShifts.value = openShifts.data.data || [];
  } else {
    todayShifts.value = r.data.data || [];
  }
}
async function loadCharges() {
  const r = await api.get('/charges', { params: { limit: 5, only_unpaid: 1 } })
  pendingCharges.value = r.data.data || []
}
async function loadPlan() {
  const r = await api.get('/plan_subscription')
  if (r.data?.trangThai === 'active') planInfo.value = r.data
}
async function loadTopDebtors() {
  const r = await api.get('/debts/top')
  topDebtors.value = r.data || []
}
async function loadAuditLog() {
  const r = await api.get('/audit_logs/tenant', { params: { limit: 200 } })
  allAuditLogs = r.data.data || []
  auditLogs.value = allAuditLogs.slice(0, 8)
}

function renderChart() {
  if (!chartCanvas.value) return
  if (chartInstance) { chartInstance.destroy(); chartInstance = null }
  const labels: string[] = []
  const counts: number[] = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(d.getDate() - i)
    const label   = d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })
    const dateStr = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
    labels.push(label)
    counts.push(allAuditLogs.filter(l => (l.thoiGianThucHien || '').startsWith(dateStr)).length)
  }
  chartInstance = new Chart(chartCanvas.value, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: 'Số lượng hành động',
        data: counts,
        borderColor: '#3d8c3d',
        backgroundColor: 'rgba(61,140,61,0.1)',
        borderWidth: 2,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#3d8c3d',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false }, tooltip: { callbacks: { label: c => `${c.raw} hành động` } } },
      scales: {
        y: { beginAtZero: true, ticks: { stepSize: 1, precision: 0 }, title: { display: true, text: 'Số lượng', color: '#6b836b' } },
        x: { title: { display: true, text: 'Ngày', color: '#6b836b' } }
      }
    }
  })
}

function dotClass(a: string) {
  if (!a) return 'dot-gray'
  if (a.includes('CREATE')) return 'dot-green'
  if (a.includes('DELETE') || a.includes('DEACTIVATE') || a.includes('INACTIVE')) return 'dot-red'
  if (a.includes('UPDATE') || a.includes('END') || a.includes('RECONCILE')) return 'dot-blue'
  return 'dot-gray'
}
function formatAction(a: string) {
  const map: Record<string,string> = {
    CREATE_RECEIPT:'Tạo phiếu thu',CREATE_CHARGE:'Tạo khoản thu',
    CREATE_COLLECTION_PERIOD:'Tạo kỳ thu',UPDATE_COLLECTION_PERIOD:'Cập nhật kỳ thu',DELETE_COLLECTION_PERIOD:'Xóa kỳ thu',
    CREATE_FEE:'Tạo biểu phí',UPDATE_FEE:'Cập nhật biểu phí',DELETE_FEE:'Xóa biểu phí',
    CREATE_FEE_ASSIGNMENT:'Gán biểu phí',DEACTIVATE_FEE_ASSIGNMENT:'Ngưng biểu phí',
    UPDATE_CHARGE_STATUS:'Cập nhật khoản thu',UPDATE_DEBT_STATUS:'Cập nhật công nợ',
    START_SHIFT:'Bắt đầu ca',END_SHIFT:'Kết thúc ca',
    CREATE_MARKET:'Tạo chợ',UPDATE_MARKET:'Cập nhật chợ',
    CREATE_KIOSK:'Tạo kiosk',UPDATE_KIOSK:'Cập nhật kiosk',
    CREATE_USER:'Tạo người dùng',CREATE_MERCHANT:'Tạo tiểu thương',
  }
  return map[a] || a?.replace(/_/g,' ')
}
function fmtMoney(n: any) { return Number(n||0).toLocaleString('vi-VN', { style:'currency', currency:'VND' }) }
function fmtDate(d: string) { return d ? new Date(d).toLocaleDateString('vi-VN') : '—' }
function fmtDt(d: string) { return d ? new Date(d).toLocaleString('vi-VN', { hour:'2-digit', minute:'2-digit', day:'2-digit', month:'2-digit' }) : '—' }
function fmtTime(d: string) { return d ? new Date(d).toLocaleTimeString('vi-VN', { hour:'2-digit', minute:'2-digit' }) : '—' }
function initials(n: string) { return (n||'?').split(' ').map((w:string)=>w[0]).slice(-2).join('').toUpperCase() }
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@300;400;500;600;700&display=swap');
*,*::before,*::after{box-sizing:border-box}
.dashboard{display:flex;flex-direction:column;gap:20px;font-family:'Be Vietnam Pro',sans-serif}
.page-header{display:flex;justify-content:space-between;align-items:flex-start}
.page-title{font-size:22px;font-weight:600;color:#1a2e1a;margin:0 0 4px;letter-spacing:-.3px}
.page-sub{font-size:13px;color:#6b836b;margin:0}
.btn-outline{display:inline-flex;align-items:center;gap:7px;height:38px;padding:0 16px;background:white;border:1.5px solid #d4e4d4;border-radius:10px;color:#4a654a;font-size:13px;font-family:'Be Vietnam Pro',sans-serif;cursor:pointer;transition:background .15s}
.btn-outline:hover{background:#f0f7f0}
.btn-outline.spinning svg{animation:spin .8s linear infinite}
@keyframes spin{to{transform:rotate(360deg)}}
.stats-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:14px}
.stat-card{background:white;border:1px solid #e2ede2;border-radius:14px;padding:18px;display:flex;align-items:center;gap:14px;cursor:pointer;transition:box-shadow .2s}
.stat-card:hover{box-shadow:0 4px 16px rgba(61,140,61,.1);border-color:#c8dfc8}
.stat-icon-wrap{width:44px;height:44px;border-radius:12px;display:flex;align-items:center;justify-content:center;flex-shrink:0}
.stat-val{font-size:26px;font-weight:600;color:#1a2e1a;line-height:1.1;margin-bottom:3px}
.stat-val--red{color:#dc2626;font-size:18px}
.stat-lbl{font-size:12.5px;color:#6b836b}
.sk-num{display:inline-block;width:48px;height:26px;background:#f0f5f0;border-radius:6px;animation:pulse 1.2s infinite}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.45}}
.card{background:white;border:1px solid #e2ede2;border-radius:14px;overflow:hidden}
.card--revenue{background:linear-gradient(135deg,#f0fdf4,#dcfce7);border-color:#bbf7d0}
.card--plan{background:linear-gradient(135deg,#fafff0,#f0fdf4);border-color:#d4e4d4}
.card-head{display:flex;justify-content:space-between;align-items:center;padding:15px 18px;border-bottom:1px solid rgba(0,0,0,.05)}
.card-title{font-size:14px;font-weight:600;color:#1a2e1a;margin:0;display:flex;align-items:center;gap:7px}
.see-all{font-size:12.5px;color:#3d8c3d;text-decoration:none;font-weight:500;white-space:nowrap}
.see-all:hover{text-decoration:underline}
.chart-card{}
.chart-container{padding:16px 20px 20px;height:320px;position:relative}
.chart-legend{display:flex;align-items:center;gap:8px}
.legend-dot{width:10px;height:10px;border-radius:50%;display:inline-block}
.legend-text{font-size:12px;color:#6b836b}
.grid-2{display:grid;grid-template-columns:1fr 1fr;gap:16px}
.revenue-big{font-size:28px;font-weight:700;color:#1a6e1a;padding:14px 18px 4px;letter-spacing:-.5px}
.revenue-sub{padding:0 18px 16px;font-size:12.5px;color:#4a7a4a}
.activity{padding:4px 0}
.act-item{display:flex;align-items:center;gap:11px;padding:10px 18px;border-bottom:1px solid #f7faf7}
.act-item:last-child{border-bottom:none}
.act-item:hover{background:#fafcfa}
.act-avatar{width:32px;height:32px;background:#0f766e;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;color:white;flex-shrink:0}
.act-dot{width:8px;height:8px;border-radius:50%;flex-shrink:0}
.dot-green{background:#3d8c3d}
.dot-red{background:#dc2626}
.dot-blue{background:#2563eb}
.dot-gray{background:#94a894}
.act-body{flex:1;min-width:0}
.act-name{font-size:13px;font-weight:500;color:#1a2e1a}
.act-meta{font-size:11.5px;color:#94a894;margin-top:2px}
.badge{display:inline-flex;align-items:center;gap:4px;padding:3px 8px;border-radius:20px;font-size:11px;font-weight:500;white-space:nowrap}
.badge-green{background:#eef7ee;color:#2d6e2d}
.badge-blue{background:#eff6ff;color:#1d4ed8}
.badge-amber{background:#fffbeb;color:#b45309}
.badge-red{background:#fef2f2;color:#dc2626}
.badge-gray{background:#f4f4f4;color:#6b7280}
.dot-live{width:6px;height:6px;background:#1d4ed8;border-radius:50%;animation:blink 1.2s infinite}
@keyframes blink{0%,100%{opacity:1}50%{opacity:.3}}
.tbl{width:100%;border-collapse:collapse}
.tbl th{padding:9px 16px;font-size:11px;font-weight:600;color:#94a894;text-transform:uppercase;letter-spacing:.06em;text-align:left;background:#fafcfa;border-bottom:1px solid #f0f5f0}
.tbl td{padding:11px 16px;border-bottom:1px solid #f7faf7;vertical-align:middle;font-size:13px}
.tbl tbody tr:last-child td{border-bottom:none}
.tbl tbody tr:hover td{background:#fafcfa}
.cell-name{font-weight:500;color:#1a2e1a}
.cell-money-red{font-weight:600;color:#dc2626;white-space:nowrap}
.kiosk-tag{background:#f0f5f0;padding:2px 7px;border-radius:5px;font-size:12px;font-family:monospace;color:#2d4a2d;font-weight:600}
.debtor-rank{width:22px;height:22px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;flex-shrink:0}
.rank-1{background:#fef3c7;color:#92400e}
.rank-2{background:#f3f4f6;color:#374151}
.rank-3{background:#fef2f2;color:#b45309}
.debtor-amount{font-size:13px;font-weight:600;color:#dc2626;white-space:nowrap}
.plan-body{padding:14px 18px 18px;display:flex;flex-direction:column;gap:10px}
.plan-name{font-size:17px;font-weight:700;color:#1a2e1a}
.plan-price{font-size:22px;font-weight:700;color:#3d8c3d}
.plan-price span{font-size:13px;font-weight:400;color:#6b836b}
.plan-limits{display:flex;flex-direction:column;gap:8px}
.plan-limit{display:flex;align-items:center;gap:7px;font-size:12.5px;color:#4a654a;flex-wrap:wrap}
.limit-bar{flex:1;min-width:60px;height:4px;background:#f0f5f0;border-radius:2px;overflow:hidden}
.limit-fill{height:100%;background:#3d8c3d;border-radius:2px;transition:width .3s}
.plan-expiry{font-size:12px;color:#6b836b}
.plan-expiry strong{color:#1a2e1a}
.empty{text-align:center;padding:28px 16px;color:#94a894;font-size:13px}
.sk-rows{padding:10px 16px;display:flex;flex-direction:column;gap:8px}
.sk-row{height:34px;background:#f0f5f0;border-radius:7px;animation:pulse 1.2s infinite}
@media(max-width:1100px){.stats-grid{grid-template-columns:repeat(2,1fr)}}
@media(max-width:800px){.grid-2{grid-template-columns:1fr}.stats-grid{grid-template-columns:repeat(2,1fr)}}
</style>