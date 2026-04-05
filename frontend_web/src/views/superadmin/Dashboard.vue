<template>
  <div class="dashboard">

    <div class="page-header">
      <div>
        <h1 class="page-title">Tổng quan hệ thống</h1>
        <p class="page-sub">Chào mừng, {{ authStore.user?.hoTen || 'Super Admin' }} · {{ today }}</p>
      </div>
    </div>

    <div class="stats-grid">
      <div v-for="s in stats" :key="s.label" class="stat-card">
        <div class="stat-icon-wrap" :style="{ background: s.bg }">
          <span v-html="s.icon" :style="{ color: s.color }"></span>
        </div>
        <div class="stat-info">
          <div class="stat-val">
            <span v-if="loading" class="sk-num"></span>
            <span v-else>{{ s.value }}</span>
          </div>
          <div class="stat-lbl">{{ s.label }}</div>
        </div>
      </div>
    </div>

    <div class="card chart-card">
      <div class="card-head">
        <h2 class="card-title">Thống kê hoạt động 7 ngày qua</h2>
        <div class="chart-legend">
          <span class="legend-dot" style="background: #3d8c3d;"></span>
          <span class="legend-text">Số lượng hành động</span>
        </div>
      </div>
      <div class="chart-container">
        <canvas ref="chartCanvas" width="800" height="300"></canvas>
      </div>
    </div>

    <div class="grid-2">

      <div class="card">
        <div class="card-head">
          <h2 class="card-title">Tenant mới nhất</h2>
          <router-link to="/super-admin/tenants" class="see-all">Xem tất cả →</router-link>
        </div>
        <div v-if="loading" class="sk-rows">
          <div v-for="i in 10" :key="i" class="sk-row"></div>
        </div>
        <table v-else class="tbl">
          <thead>
            <tr>
              <th>Tên</th>
              <th>Trạng thái</th>
              <th>Gói</th>
              <th>Ngày tạo</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="t in tenants" :key="t.tenant_id" class="tbl-row" @click="router.push('/super-admin/tenants')">
              <td>
                <div class="cell-name">{{ t.tenBanQuanLy }}</div>
                <div class="cell-sub">{{ t.email }}</div>
              </td>
              <td>
                <span class="badge" :class="t.trangThai === 'active' ? 'badge-green' : 'badge-red'">
                  {{ t.trangThai === 'active' ? 'Hoạt động' : 'Đã khóa' }}
                </span>
              </td>
              <td>
                <span class="plan-tag">{{ getTenantPlan(t.tenant_id) || '—' }}</span>
              </td>
              <td class="cell-date">{{ d(t.created_at) }}</td>
            </tr>
            <tr v-if="!tenants.length">
              <td colspan="4" class="empty">Chưa có dữ liệu</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="card">
        <div class="card-head">
          <h2 class="card-title">Hoạt động gần đây</h2>
          <router-link to="/super-admin/audit-logs" class="see-all">Xem log →</router-link>
        </div>
        <div v-if="loading" class="sk-rows"><div v-for="i in 6" :key="i" class="sk-row"></div></div>
        <div v-else class="activity">
          <div v-for="l in logs" :key="l.log_id" class="act-item">
            <div class="act-dot" :class="dotClass(l.hanhDong)"></div>
            <div>
              <div class="act-action">{{ fmtAction(l.hanhDong) }}</div>
              <div class="act-meta">{{ l.performer_email || l.performer_name || 'System' }} · {{ dt(l.thoiGianThucHien || l.created_at) }}</div>
            </div>
          </div>
          <div v-if="!logs.length" class="empty">Chưa có hoạt động</div>
        </div>
      </div>

    </div>

    <div class="card">
      <div class="card-head">
        <h2 class="card-title">Subscription đang hoạt động</h2>
        <router-link to="/super-admin/subscriptions" class="see-all">Xem tất cả →</router-link>
      </div>
      <div v-if="loading" class="sk-rows">
        <div v-for="i in 4" :key="i" class="sk-row"></div>
      </div>
      <table v-else class="tbl">
        <thead>
          <tr>
            <th>Tenant</th>
            <th>Plan</th>
            <th>Trạng thái</th>
            <th>Bắt đầu</th>
            <th>Kết thúc</th>
            </tr>
        </thead>
        <tbody>
          <tr v-for="s in subs" :key="s.subscription_id">
            <td class="cell-name">{{ s.tenBanQuanLy }}  </td>
            <td><span class="plan-tag">{{ s.tenGoi }}</span></td>
            <td>
              <span class="badge" :class="s.trangThai === 'active' ? 'badge-green' : 'badge-amber'">
                {{ s.trangThai === 'active' ? 'Hoạt động' : s.trangThai }}
              </span>
            </td>
            <td class="cell-date">{{ d(s.ngayBatDau) }}</td>
            <td class="cell-date">{{ d(s.ngayKetThuc) }}</td>
          </tr>
          <tr v-if="!subs.length">
            <td colspan="6" class="empty">Chưa có dữ liệu</td>
          </tr>
        </tbody>
      </table>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import api from '@/api/axios'
import Chart from 'chart.js/auto'

interface AuditLog {
  log_id: number
  hanhDong: string
  thoiGianThucHien?: string
  created_at?: string
  performer_email?: string
  performer_name?: string
}

const router = useRouter()
const authStore = useAuthStore()
const loading = ref(true)
const tenants = ref<any[]>([])
const logs = ref<any[]>([])
const subs = ref<any[]>([])
const chartCanvas = ref<HTMLCanvasElement | null>(null)
let chartInstance: Chart | null = null
let chartLogsData: AuditLog[] = [] 


const today = new Date().toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })

const stats = ref<Array<{ label: string; value: number | string; bg: string; color: string; icon: string }>>([
  { label: 'Tổng Tenant', value: '—', bg: '#eef7ee', color: '#3d8c3d', icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>` },
  { label: 'Gói cước', value: '—', bg: '#eff6ff', color: '#2563eb', icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>` },
  { label: 'Subscription', value: '—', bg: '#fef3c7', color: '#d97706', icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>` },
  { label: 'Audit Log hôm nay', value: '—', bg: '#f5f3ff', color: '#7c3aed', icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>` },
])

function formatDateVN(date: Date | string): string {
  const d = new Date(date)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

async function renderChart() {
  if (!chartCanvas.value) return
  
  const last7Days = getLast7Days()
  const chartData = await getChartData(last7Days)
  
  if (chartInstance) {
    chartInstance.destroy()
  }
  
  chartInstance = new Chart(chartCanvas.value, {
    type: 'line',
    data: {
      labels: chartData.labels,
      datasets: [
        {
          label: 'Số lượng hành động',
          data: chartData.values,
          borderColor: '#3d8c3d',
          backgroundColor: 'rgba(61, 140, 61, 0.1)',
          borderWidth: 2,
          fill: true,
          tension: 0.4,
          pointBackgroundColor: '#3d8c3d',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6,
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          callbacks: {
            label: (context) => `${context.raw} hành động`
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            stepSize: 1,
            precision: 0
          },
          title: {
            display: true,
            text: 'Số lượng',
            color: '#6b836b'
          }
        },
        x: {
          title: {
            display: true,
            text: 'Ngày',
            color: '#6b836b'
          }
        }
      }
    }
  })
}

function getLast7Days() {
  const days = []
  for (let i = 6; i >= 0; i--) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    days.push(date)
  }
  return days
}

onMounted(async () => {
  loading.value = true
  
  try {
    const tenantRes = await api.get('/tenant/list?limit=5&sortBy=created_at&sortOrder=DESC')
    if (tenantRes.data && tenantRes.data.data) {
      tenants.value = tenantRes.data.data
      stats.value[0].value = tenantRes.data.pagination?.total || tenants.value.length
    }
    
    const recentLogRes = await api.get('/audit_logs/superadmin?limit=10')
    if (recentLogRes.data && recentLogRes.data.data) {
      logs.value = recentLogRes.data.data
    }
    
    const chartLogRes = await api.get('/audit_logs/superadmin?limit=100000')
  if (chartLogRes.data && chartLogRes.data.data) {
    chartLogsData = chartLogRes.data.data
    
    const todayStr = formatDateVN(new Date())
    const todayLogs = chartLogsData.filter((log: AuditLog) => {
      const logDate = formatDateVN(log.thoiGianThucHien || log.created_at || '')
      return logDate === todayStr
    })
    stats.value[3].value = todayLogs.length
  }
    
    const subRes = await api.get('/plan_subscription/list?limit=5&sortBy=created_at&sortOrder=DESC')
    console.log('Subscription response:', subRes.data) 
    
    if (subRes.data && subRes.data.data) {
      subs.value = subRes.data.data
      stats.value[2].value = subRes.data.pagination?.total || subs.value.length
    }
    
    const planRes = await api.get('/plan/list?limit=10')
    if (planRes.data && planRes.data.pagination) {
      stats.value[1].value = planRes.data.pagination.total
    }
    
    await nextTick()
    await renderChart()
    
  } catch (error) {
    console.error('Error loading dashboard:', error)
  } finally {
    loading.value = false
  }
})

async function getChartData(days: Date[]) {
  const labels = days.map(d => d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }))
  const values = new Array(7).fill(0)
  
  chartLogsData.forEach((log: AuditLog) => {
    const logDateStr = formatDateVN(log.thoiGianThucHien || log.created_at || '')
    const logLabel = new Date(logDateStr).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })
    const index = labels.indexOf(logLabel)
    if (index !== -1) {
      values[index]++
    }
  })
  
  return { labels, values }
}

const d = (v: string) => v ? new Date(v).toLocaleDateString('vi-VN') : '—'
const dt = (v: string) => v ? new Date(v).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' }) : '—'

const fmtAction = (a: string) => {
  if (!a) return '—'
  const actionMap: Record<string, string> = {
    'CREATE_TENANT': 'Tạo tenant',
    'CREATE_PLAN': 'Tạo gói cước',
    'CREATE_PLAN_SUBSCRIPTION': 'Gán gói cước',
    'UPDATE_TENANT': 'Cập nhật tenant',
    'UPDATE_PLAN': 'Cập nhật gói cước',
    'INACTIVE_PLAN': 'Ngưng gói cước',
    'UPDATE_TENANT_STATUS': 'Cập nhật trạng thái tenant',
  }
  return actionMap[a] || a?.replace(/_/g, ' ') || a
}

const dotClass = (a: string) => {
  if (!a) return 'dot-gray'
  if (a.includes('CREATE')) return 'dot-green'
  if (a.includes('DELETE') || a.includes('INACTIVE')) return 'dot-red'
  if (a.includes('UPDATE') || a.includes('CHANGE')) return 'dot-blue'
  return 'dot-gray'
}

const getTenantPlan = (tenantId: number) => {
  const sub = subs.value.find(s => s.tenant_id === tenantId && s.trangThai === 'active')
  return sub?.tenGoi || '—'
}
</script>

<style scoped>
.chart-card {
  margin-bottom: 8px;
}

.chart-container {
  padding: 20px;
  height: 350px;
  position: relative;
}

.chart-legend {
  display: flex;
  align-items: center;
  gap: 8px;
}

.legend-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  display: inline-block;
}

.legend-text {
  font-size: 12px;
  color: #6b836b;
}
.dashboard { display: flex; flex-direction: column; gap: 22px; }

.page-header { display: flex; justify-content: space-between; align-items: flex-start; }
.page-title { font-size: 22px; font-weight: 600; color: #1a2e1a; margin: 0 0 4px; letter-spacing: -.3px; }
.page-sub { font-size: 13px; color: #6b836b; margin: 0; }

.stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; }

.stat-card {
  background: white;
  border: 1px solid #e2ede2;
  border-radius: 14px;
  padding: 18px;
  display: flex;
  align-items: center;
  gap: 14px;
}
.stat-icon-wrap { width: 44px; height: 44px; border-radius: 12px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.stat-val { font-size: 26px; font-weight: 600; color: #1a2e1a; line-height: 1.1; margin-bottom: 3px; }
.stat-lbl { font-size: 12.5px; color: #6b836b; }
.sk-num { display: inline-block; width: 48px; height: 26px; background: #f0f5f0; border-radius: 6px; animation: p 1.2s infinite; }
@keyframes p { 0%,100%{opacity:1} 50%{opacity:.45} }

.grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }

.card {
  background: white;
  border: 1px solid #e2ede2;
  border-radius: 14px;
  overflow: hidden;
}

.card-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 18px;
  border-bottom: 1px solid #f0f5f0;
}
.card-title { font-size: 14px; font-weight: 600; color: #1a2e1a; margin: 0; }
.see-all { font-size: 12.5px; color: #3d8c3d; text-decoration: none; font-weight: 500; }
.see-all:hover { color: #2d6e2d; }

.tbl { width: 100%; border-collapse: collapse; }
.tbl th { padding: 9px 16px; font-size: 11px; font-weight: 600; color: #94a894; text-transform: uppercase; letter-spacing: .06em; text-align: left; background: #fafcfa; border-bottom: 1px solid #f0f5f0; }
.tbl td { padding: 12px 16px; border-bottom: 1px solid #f7faf7; vertical-align: middle; }
.tbl-row { cursor: pointer; }
.tbl-row:hover td { background: #fafcfa; }
.tbl tbody tr:last-child td { border-bottom: none; }

.cell-name { font-size: 13px; font-weight: 500; color: #1a2e1a; }
.cell-sub { font-size: 11.5px; color: #94a894; }
.cell-date { font-size: 12px; color: #6b836b; white-space: nowrap; }


.badge { display: inline-flex; padding: 2px 8px; border-radius: 20px; font-size: 11.5px; font-weight: 500; }
.badge-green { background: #eef7ee; color: #2d6e2d; }
.badge-red { background: #fef2f2; color: #dc2626; }
.badge-amber { background: #fffbeb; color: #b45309; }

.plan-tag { display: inline-flex; padding: 2px 8px; background: #eff6ff; color: #1d4ed8; border-radius: 20px; font-size: 11.5px; font-weight: 500; }
.empty { text-align: center; padding: 32px !important; color: #94a894; font-size: 13px; }

.sk-rows { padding: 12px 16px; display: flex; flex-direction: column; gap: 9px; }
.sk-row { height: 34px; background: #f0f5f0; border-radius: 7px; animation: p 1.2s infinite; }

.activity { padding: 4px 0; }
.act-item { display: flex; align-items: flex-start; gap: 11px; padding: 10px 18px; border-bottom: 1px solid #f7faf7; }
.act-item:last-child { border-bottom: none; }
.act-dot { width: 8px; height: 8px; border-radius: 50%; margin-top: 4px; flex-shrink: 0; }
.dot-green { background: #3d8c3d; }
.dot-red { background: #dc2626; }
.dot-blue { background: #2563eb; }
.dot-gray { background: #94a894; }
.act-action { font-size: 13px; font-weight: 500; color: #1a2e1a; }
.act-meta { font-size: 11.5px; color: #94a894; margin-top: 2px; }

@media (max-width: 1024px) { .stats-grid { grid-template-columns: repeat(2, 1fr); } .grid-2 { grid-template-columns: 1fr; } }
@media (max-width: 600px) { .stats-grid { grid-template-columns: 1fr 1fr; } }
</style>