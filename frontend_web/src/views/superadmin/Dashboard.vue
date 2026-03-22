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

    <div class="grid-2">

      <div class="card">
        <div class="card-head">
          <h2 class="card-title">Tenant mới nhất</h2>
          <router-link to="/super-admin/tenants" class="see-all">Xem tất cả →</router-link>
        </div>
        <div v-if="loading" class="sk-rows"><div v-for="i in 5" :key="i" class="sk-row"></div></div>
        <table v-else class="tbl">
          <thead><tr><th>Tên</th><th>Trạng thái</th><th>Gói</th><th>Ngày tạo</th></tr></thead>
          <tbody>
            <tr v-for="t in tenants" :key="t.tenant_id" class="tbl-row" @click="router.push('/super-admin/tenants')">
              <td>
                <div class="cell-name">{{ t.tenBanQuanLy }}</div>
                <div class="cell-sub">{{ t.email }}</div>
              </td>
              <td><span class="badge" :class="t.trangThai === 'active' ? 'badge-green' : 'badge-red'">{{ t.trangThai === 'active' ? 'Hoạt động' : 'Đã khóa' }}</span></td>
              <td><span class="plan-tag">{{ t.tenGoi || '—' }}</span></td>
              <td class="cell-date">{{ d(t.created_at) }}</td>
            </tr>
            <tr v-if="!tenants.length"><td colspan="4" class="empty">Chưa có dữ liệu</td></tr>
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
            <div class="act-dot" :class="dotClass(l.action)"></div>
            <div>
              <div class="act-action">{{ fmtAction(l.action) }}</div>
              <div class="act-meta">{{ l.actor_email }} · {{ dt(l.created_at) }}</div>
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
      <div v-if="loading" class="sk-rows"><div v-for="i in 4" :key="i" class="sk-row"></div></div>
      <table v-else class="tbl">
        <thead><tr><th>Tenant</th><th>Plan</th><th>Trạng thái</th><th>Bắt đầu</th><th>Kết thúc</th><th>Giá</th></tr></thead>
        <tbody>
          <tr v-for="s in subs" :key="s.subscription_id">
            <td class="cell-name">{{ s.tenBanQuanLy }}</td>
            <td><span class="plan-tag">{{ s.tenGoi }}</span></td>
            <td><span class="badge" :class="s.trangThai === 'active' ? 'badge-green' : 'badge-amber'">{{ s.trangThai }}</span></td>
            <td class="cell-date">{{ d(s.ngayBatDau) }}</td>
            <td class="cell-date">{{ d(s.ngayKetThuc) }}</td>
            <td class="cell-price">{{ price(s.giaTien) }}</td>
          </tr>
          <tr v-if="!subs.length"><td colspan="6" class="empty">Chưa có dữ liệu</td></tr>
        </tbody>
      </table>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import api from '@/api/axios'

const router = useRouter()
const authStore = useAuthStore()
const loading = ref(true)
const tenants = ref<any[]>([])
const logs = ref<any[]>([])
const subs = ref<any[]>([])

const today = new Date().toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })

const stats = ref([
  { label: 'Tổng Tenant', value: '—', bg: '#eef7ee', color: '#3d8c3d', icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>` },
  { label: 'Gói cước', value: '—', bg: '#eff6ff', color: '#2563eb', icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>` },
  { label: 'Subscription', value: '—', bg: '#fef3c7', color: '#d97706', icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>` },
  { label: 'Audit Log hôm nay', value: '—', bg: '#f5f3ff', color: '#7c3aed', icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>` },
])

onMounted(async () => {
  const [t, l, s, p] = await Promise.allSettled([
    api.get('/tenant/list?limit=5&sortOrder=DESC'),
    api.get('/audit_logs/superadmin?limit=8'),
    api.get('/plan_subscription/list?limit=5'),
    api.get('/plan/list?limit=1'),
  ])
  if (t.status === 'fulfilled') { tenants.value = t.value.data.data || []; stats.value[0].value = t.value.data.pagination?.total ?? tenants.value.length }
  if (l.status === 'fulfilled') { logs.value = l.value.data.data || []; stats.value[3].value = l.value.data.meta?.total ?? logs.value.length }
  if (s.status === 'fulfilled') { subs.value = s.value.data.data || []; stats.value[2].value = s.value.data.pagination?.total ?? subs.value.length }
  if (p.status === 'fulfilled') stats.value[1].value = p.value.data.pagination?.total ?? '—'
  loading.value = false
})

const d = (v: string) => v ? new Date(v).toLocaleDateString('vi-VN') : '—'
const dt = (v: string) => v ? new Date(v).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' }) : '—'
const price = (v: number) => v ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(v) : '—'
const fmtAction = (a: string) => a?.replace(/_/g, ' ') || a
const dotClass = (a: string) => {
  if (a?.includes('CREATE')) return 'dot-green'
  if (a?.includes('DELETE') || a?.includes('INACTIVE')) return 'dot-red'
  if (a?.includes('UPDATE') || a?.includes('CHANGE')) return 'dot-blue'
  return 'dot-gray'
}
</script>

<style scoped>
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
.cell-price { font-size: 13px; font-weight: 500; color: #1a2e1a; }

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