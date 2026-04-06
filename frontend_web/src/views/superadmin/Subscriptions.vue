<template>
  <div class="sub-page">

    <div class="page-header">
      <div>
        <h1 class="page-title">Subscriptions</h1>
      </div>
    </div>

    <div class="filter-bar">
      <div class="search-wrap">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <input v-model="filters.keyword" placeholder="Tìm theo tên tenant, plan..." @input="debounceFetch" />
      </div>
      <select v-model="filters.trangThai" @change="fetch">
        <option value="">Tất cả trạng thái</option>
        <option value="active">Đang hoạt động</option>
        <option value="expired">Đã hết hạn</option>
        <option value="trial">Dùng thử</option>
      </select>
      <select v-model="filters.plan_id" @change="fetch">
        <option value="">Tất cả plan</option>
        <option v-for="p in plans" :key="p.plan_id" :value="p.plan_id">{{ p.tenGoi || p.tenPlan }}</option>
      </select>
      <input type="date" v-model="filters.ngayBatDau" @change="fetch" class="date-input" title="Từ ngày bắt đầu" />
      <input type="date" v-model="filters.ngayKetThuc" @change="fetch" class="date-input" title="Đến ngày kết thúc" />
    </div>

    <div class="summary-row">
      <div class="sum-card" v-for="s in summary" :key="s.label">
        <div class="sum-val" :style="{ color: s.color }">{{ s.value }}</div>
        <div class="sum-lbl">{{ s.label }}</div>
      </div>
    </div>

    <div class="table-panel">
      <div class="table-wrap">
        <table class="tbl">
          <thead>
            <tr>
              <th>Tenant</th>
              <th>Gói cước</th>
              <th>Trạng thái</th>
              <th>Ngày bắt đầu</th>
              <th>Ngày kết thúc</th>
              <th>Thanh toán</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading"><td colspan="7"><div class="loading-bar"></div></td></tr>
            <tr v-for="s in subs" :key="s.subscription_id" class="tbl-row">
              <td>
                <div class="cell-with-av">
                  <div class="av-sq" :style="{ background: avBg(s.tenBanQuanLy) }">{{ ini(s.tenBanQuanLy) }}</div>
                  <div class="cell-name">{{ s.tenBanQuanLy }}</div>
                </div>
              </td>
              <td><span class="plan-tag">{{ s.tenGoi }}</span></td>
              <td>
                <span class="badge" :class="statusCls(s.trangThai)">
                  <span class="badge-dot"></span>
                  <template v-if="s.trangThai === 'trial'">
                    Dùng thử
                    <span class="trial-countdown" v-if="isExpiringSoon(s.ngayKetThuc)">
                      (còn {{ daysLeft(s.ngayKetThuc) }} ngày)
                    </span>
                  </template>
                  <template v-else-if="s.trangThai === 'expired' && s.grace_period_end && new Date(s.grace_period_end) > new Date()">
                    Quá hạn (còn {{ daysLeft(s.grace_period_end) }} ngày gia hạn)
                  </template>
                  <template v-else>
                    {{ statusLabel(s.trangThai) }}
                  </template>
                </span>
              </td>
              <td class="cell-date">{{ d(s.ngayBatDau) }}</td>
              <td class="cell-date">
                <span :class="{ 'expiring-soon': isExpiringSoon(s.ngayKetThuc) }">{{ d(s.ngayKetThuc) }}</span>
              </td>
              <td>
                <span class="pay-badge" :class="paymentCls(s)">{{ paymentLabel(s) }}</span>
              </td>
              <td>
                <button class="icon-btn" title="Xem chi tiết" @click="openDetail(s)">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                </button>
              </td>
            </tr>
            <tr v-if="!loading && !subs.length">
              <td colspan="7" class="empty">Không có subscription nào</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="table-foot">
        <span class="total-label">Tổng {{ meta.total }} subscriptions</span>
        <div class="pagination">
          <button :disabled="filters.page <= 1" @click="filters.page--; fetch()">← Trước</button>
          <span>{{ filters.page }} / {{ meta.totalPages || 1 }}</span>
          <button :disabled="filters.page >= (meta.totalPages || 1)" @click="filters.page++; fetch()">Tiếp →</button>
        </div>
      </div>
    </div>

    <Teleport to="body">
      <div v-if="detailModal && selected" class="modal-overlay" @click.self="detailModal = false">
        <div class="modal">
          <div class="modal-head">
            <h3>Chi tiết Subscription #{{ selected.subscription_id }}</h3>
            <button class="modal-close" @click="detailModal = false">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
          <div class="modal-body">

            <div class="detail-hero">
              <div class="detail-hero-left">
                <div class="detail-tenant">{{ selected.tenBanQuanLy }}</div>
                <div class="detail-plan">{{ selected.tenGoi }}</div>
              </div>
              <div class="detail-price">{{ price(selected.giaTien) }}<span>/tháng</span></div>
            </div>

            <div class="detail-grid">
              <div class="detail-item">
                <div class="detail-lbl">Trạng thái</div>
                <span class="badge" :class="statusCls(selected.trangThai)">
                  <span class="badge-dot"></span>{{ statusLabel(selected.trangThai) }}
                </span>
              </div>
              <div class="detail-item">
                <div class="detail-lbl">Thanh toán</div>
                <span class="pay-badge" :class="paymentCls(selected)">{{ paymentLabel(selected) }}</span>
              </div>
              <div class="detail-item">
                <div class="detail-lbl">Ngày bắt đầu</div>
                <div class="detail-val">{{ d(selected.ngayBatDau) }}</div>
              </div>
              <div class="detail-item">
                <div class="detail-lbl">Ngày kết thúc</div>
                <div class="detail-val" :class="{ 'text-warn': isExpiringSoon(selected.ngayKetThuc) }">
                  {{ d(selected.ngayKetThuc) }}
                </div>
              </div>
              <div class="detail-item">
                <div class="detail-lbl">Ngày tạo</div>
                <div class="detail-val">{{ dt(selected.created_at) }}</div>
              </div>
              <div class="detail-item" v-if="selected.stripe_subscription_id">
                <div class="detail-lbl">Stripe ID</div>
                <div class="detail-val mono">{{ selected.stripe_subscription_id }}</div>
              </div>
            </div>

            <div class="timeline" v-if="selected.created_at">
              <div class="timeline-title">Lịch sử trạng thái</div>

              <div class="timeline-item">
                <div class="tl-dot tl-dot--green"></div>
                <div class="tl-body">
                  <div class="tl-action">Subscription được tạo</div>
                  <div class="tl-time">{{ dt(selected.created_at) }}</div>
                </div>
              </div>

              <div class="timeline-item"
                v-if="selected.trangThai !== 'expired'
                      && !selected.stripe_subscription_id
                      && selected.paymentStatus !== 'succeeded'">
                <div class="tl-dot tl-dot--green"></div>
                <div class="tl-body">
                  <div class="tl-action">Đã thu phí (offline)</div>
                  <div class="tl-time">{{ dt(selected.tenantCreatedAt || selected.created_at) }}</div>
                </div>
              </div>

              <div class="timeline-item" v-if="selected.paymentStatus === 'succeeded'">
                <div class="tl-dot tl-dot--blue"></div>
                <div class="tl-body">
                  <div class="tl-action">Thanh toán thành công</div>
                  <div class="tl-time">{{ dt(selected.updated_at || selected.created_at) }}</div>
                </div>
              </div>

              <div class="timeline-item" v-if="selected.trangThai === 'active'">
                <div class="tl-dot tl-dot--green"></div>
                <div class="tl-body">
                  <div class="tl-action">Đang hoạt động</div>
                  <div class="tl-time">Hết hạn: {{ d(selected.ngayKetThuc) }}</div>
                </div>
              </div>

              <div class="timeline-item" v-if="selected.trangThai === 'expired'">
                <div class="tl-dot tl-dot--red"></div>
                <div class="tl-body">
                  <div class="tl-action">Đã hết hạn — cần gia hạn hoặc nâng cấp plan</div>
                  <div class="tl-time">{{ d(selected.ngayKetThuc) }}</div>
                </div>
              </div>

              <div class="timeline-item" v-if="selected.trangThai === 'trial'">
                <div class="tl-dot tl-dot--blue"></div>
                <div class="tl-body">
                  <div class="tl-action">Đang dùng thử</div>
                  <div class="tl-time">Kết thúc: {{ d(selected.ngayKetThuc) }}</div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </Teleport>

  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import api from '@/api/axios'

const loading = ref(true)
const subs    = ref<any[]>([])
const plans   = ref<any[]>([])
const meta    = ref({ total: 0, totalPages: 1 })
const detailModal = ref(false)
const selected    = ref<any>(null)

const filters = reactive({
  keyword:     '',
  trangThai:   '',
  plan_id:     '',
  ngayBatDau:  '', 
  ngayKetThuc: '',
  page:        1,
  limit:       10,
  sortBy:      'created_at',
  sortOrder:   'DESC',
})

const summary = computed(() => {
  const all   = subs.value
  const total = meta.value.total
  return [
    { label: 'Tổng số',           value: total,                                                          color: '#1a2e1a' },
    { label: 'Đang hoạt động',    value: all.filter(s => s.trangThai === 'active').length,               color: '#3d8c3d' },
    { label: 'Đã hết hạn',        value: all.filter(s => s.trangThai === 'expired').length,              color: '#dc2626' },
    { label: 'Thanh toán chuyển khoản', value: all.filter(s => s.paymentStatus === 'succeeded').length,        color: '#2563eb' },
    { label: 'Dùng thử',          value: all.filter(s => s.trangThai === 'trial').length,                color: '#d97706' },
  ]
})

function paymentLabel(s: any): string {
  if (s.trangThai === 'expired')          return '—'
  if (s.paymentStatus === 'succeeded')    return 'Đã thanh toán'
  if (s.trangThai === 'active' && !s.stripe_subscription_id) return 'Đã thu phí'
  return 'Chưa thanh toán'
}

function daysLeft(date: string) {
  if (!date) return 0;
  const diff = new Date(date).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function paymentCls(s: any): string {
  if (s.trangThai === 'expired')          return 'pay-gray'
  if (s.paymentStatus === 'succeeded')    return 'pay-paid'
  if (s.trangThai === 'active' && !s.stripe_subscription_id) return 'pay-offline'
  return 'pay-unpaid'
}

let debounceTimer: any
function debounceFetch() {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => { filters.page = 1; fetch() }, 400)
}

onMounted(async () => {
  await fetch()
  const res = await api.get('/plan').catch(() => ({ data: [] }))
  plans.value = res.data || []
})

async function fetch() {
  loading.value = true
  try {
    const params = new URLSearchParams(
      Object.fromEntries(
        Object.entries(filters)
          .filter(([, v]) => v !== '' && v !== null && v !== undefined)
          .map(([k, v]) => [k, String(v)])
      )
    )
    const res = await api.get(`/plan_subscription/list?${params}`)
    subs.value  = res.data.data || []
    meta.value  = res.data.pagination || { total: 0, totalPages: 1 }
  } catch {
    subs.value = []
  } finally {
    loading.value = false
  }
}

function openDetail(s: any) { selected.value = s; detailModal.value = true }

function statusCls(s: string) {
  return ({ active: 'badge-green', expired: 'badge-red', trial: 'badge-blue' } as Record<string,string>)[s] || 'badge-gray'
}
function statusLabel(s: string) {
  return ({ active: 'Đang hoạt động', expired: 'Đã hết hạn', trial: 'Dùng thử' } as Record<string,string>)[s] || s
}
function isExpiringSoon(date: string) {
  if (!date) return false
  const diff = new Date(date).getTime() - Date.now()
  return diff > 0 && diff < 7 * 24 * 60 * 60 * 1000
}

const d  = (v: string) => v ? new Date(v).toLocaleDateString('vi-VN') : '—'
const dt = (v: string) => v ? new Date(v).toLocaleString('vi-VN', { hour:'2-digit', minute:'2-digit', day:'2-digit', month:'2-digit', year:'numeric' }) : '—'
const price = (v: number) => v ? new Intl.NumberFormat('vi-VN', { style:'currency', currency:'VND' }).format(v) : '—'
const ini   = (n: string) => (n || '?').split(' ').map((w:string) => w[0]).slice(-2).join('').toUpperCase()
const avBgs = ['#eef7ee','#eff6ff','#fffbeb','#f5f3ff','#fff1f2']
const avBg  = (n: string) => avBgs[(n?.charCodeAt(0)||0) % avBgs.length]
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@300;400;500;600&display=swap');
* { box-sizing: border-box; }

.trial-countdown {
  font-size: 10px;
  opacity: 0.8;
  margin-left: 4px;
}

.sub-page { display: flex; flex-direction: column; gap: 20px; font-family: 'Be Vietnam Pro', sans-serif; }
.page-header { display: flex; justify-content: space-between; align-items: flex-start; }
.page-title { font-size: 22px; font-weight: 600; color: #1a2e1a; margin: 0 0 4px; letter-spacing: -.3px; }
.page-sub { font-size: 13px; color: #6b836b; margin: 0; }

.filter-bar { display: flex; gap: 10px; flex-wrap: wrap; align-items: center; }
.search-wrap { flex: 1; min-width: 200px; max-width: 300px; position: relative; display: flex; align-items: center; }
.search-wrap svg { position: absolute; left: 11px; color: #94a894; pointer-events: none; }
.search-wrap input { width: 100%; height: 38px; padding: 0 12px 0 33px; border: 1.5px solid #d4e4d4; border-radius: 10px; font-size: 13px; font-family: 'Be Vietnam Pro', sans-serif; color: #1a2e1a; background: white; outline: none; }
.search-wrap input:focus { border-color: #3d8c3d; }
select, .date-input { height: 38px; padding: 0 10px; border: 1.5px solid #d4e4d4; border-radius: 10px; font-size: 13px; font-family: 'Be Vietnam Pro', sans-serif; color: #1a2e1a; background: white; outline: none; cursor: pointer; }
select:focus, .date-input:focus { border-color: #3d8c3d; }

.summary-row { display: grid; grid-template-columns: repeat(5, 1fr); gap: 12px; }
.sum-card { background: white; border: 1px solid #e2ede2; border-radius: 12px; padding: 16px 18px; transition: all 0.2s; }
.sum-card:hover { box-shadow: 0 2px 8px rgba(0,0,0,0.04); transform: translateY(-1px); }
.sum-val { font-size: 26px; font-weight: 600; line-height: 1.1; margin-bottom: 4px; }
.sum-lbl { font-size: 12px; color: #6b836b; }

.table-panel { background: white; border: 1px solid #e2ede2; border-radius: 14px; overflow: hidden; }
.table-wrap { overflow-x: auto; }
.tbl { width: 100%; border-collapse: collapse; }
.tbl th { padding: 10px 14px; font-size: 11px; font-weight: 600; color: #94a894; text-transform: uppercase; letter-spacing: .06em; text-align: left; background: #fafcfa; border-bottom: 1px solid #f0f5f0; white-space: nowrap; }
.tbl td { padding: 12px 14px; border-bottom: 1px solid #f7faf7; vertical-align: middle; }
.tbl-row:hover td { background: #fafcfa; }
.tbl tbody tr:last-child td { border-bottom: none; }

.cell-with-av { display: flex; align-items: center; gap: 9px; }
.av-sq { width: 32px; height: 32px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 600; color: #2d4a2d; flex-shrink: 0; }
.cell-name { font-size: 13px; font-weight: 500; color: #1a2e1a; }
.cell-date { font-size: 12.5px; color: #6b836b; white-space: nowrap; }
.expiring-soon { color: #d97706; font-weight: 500; }
.text-warn { color: #d97706; }

.badge { display: inline-flex; align-items: center; gap: 5px; padding: 3px 9px; border-radius: 20px; font-size: 11.5px; font-weight: 500; white-space: nowrap; }
.badge-dot { width: 5px; height: 5px; border-radius: 50%; background: currentColor; opacity: 0.6; }
.badge-green { background: #eef7ee; color: #2d6e2d; }
.badge-red   { background: #fef2f2; color: #dc2626; }
.badge-amber { background: #fffbeb; color: #b45309; }
.badge-gray  { background: #f4f4f4; color: #6b7280; }
.badge-blue  { background: #eff6ff; color: #1d4ed8; }

.plan-tag { display: inline-flex; padding: 3px 8px; background: #eff6ff; color: #1d4ed8; border-radius: 20px; font-size: 11.5px; font-weight: 500; white-space: nowrap; }

.pay-badge   { display: inline-flex; padding: 3px 9px; border-radius: 20px; font-size: 11.5px; font-weight: 500; white-space: nowrap; }
.pay-paid    { background: #eef7ee; color: #2d6e2d; }   /* Stripe succeeded   */
.pay-offline { background: #f0fdf4; color: #15803d; }   /* Super admin offline */
.pay-unpaid  { background: #fffbeb; color: #b45309; }   /* Chưa thanh toán    */
.pay-gray    { background: #f4f4f4; color: #9ca3af; }   /* Expired → —        */

.icon-btn { width: 30px; height: 30px; background: none; border: 1px solid #e2ede2; border-radius: 7px; display: flex; align-items: center; justify-content: center; cursor: pointer; color: #4a654a; transition: all .15s; }
.icon-btn:hover { background: #f0f7f0; border-color: #3d8c3d; color: #3d8c3d; }
.empty { text-align: center; padding: 40px !important; color: #94a894; font-size: 13px; }

.loading-bar { height: 3px; background: linear-gradient(90deg, #eef7ee, #3d8c3d, #eef7ee); background-size: 200%; animation: shimmer 1.5s infinite; }
@keyframes shimmer { to { background-position: -200% center; } }

.table-foot { display: flex; justify-content: space-between; align-items: center; padding: 12px 16px; border-top: 1px solid #f0f5f0; }
.total-label { font-size: 12.5px; color: #94a894; }
.pagination { display: flex; align-items: center; gap: 10px; }
.pagination button { height: 32px; padding: 0 12px; background: white; border: 1px solid #e2ede2; border-radius: 8px; cursor: pointer; font-size: 12.5px; font-family: 'Be Vietnam Pro', sans-serif; color: #4a654a; transition: background .15s; }
.pagination button:hover:not(:disabled) { background: #f0f7f0; border-color: #3d8c3d; }
.pagination button:disabled { opacity: 0.4; cursor: not-allowed; }
.pagination span { font-size: 12.5px; color: #6b836b; }

.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 1rem; }
.modal { background: white; border-radius: 16px; width: 100%; max-width: 520px; max-height: 88vh; overflow-y: auto; box-shadow: 0 20px 60px rgba(0,0,0,0.15); }
.modal-head { display: flex; justify-content: space-between; align-items: center; padding: 18px 22px 14px; border-bottom: 1px solid #f0f5f0; }
.modal-head h3 { font-size: 15px; font-weight: 600; color: #1a2e1a; margin: 0; }
.modal-close { background: none; border: none; color: #94a894; cursor: pointer; display: flex; align-items: center; padding: 4px; border-radius: 6px; transition: all .15s; }
.modal-close:hover { background: #f0f5f0; color: #dc2626; }
.modal-body { padding: 20px 22px; display: flex; flex-direction: column; gap: 18px; }

.detail-hero { display: flex; justify-content: space-between; align-items: flex-start; padding: 16px 18px; background: #f7faf7; border-radius: 12px; border: 1px solid #e2ede2; }
.detail-tenant { font-size: 16px; font-weight: 600; color: #1a2e1a; margin-bottom: 4px; }
.detail-plan { font-size: 13px; color: #6b836b; }
.detail-price { font-size: 22px; font-weight: 700; color: #3d8c3d; white-space: nowrap; }
.detail-price span { font-size: 13px; font-weight: 400; color: #6b836b; }

.detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
.detail-item { display: flex; flex-direction: column; gap: 5px; }
.detail-lbl { font-size: 11px; font-weight: 600; color: #94a894; text-transform: uppercase; letter-spacing: .06em; }
.detail-val { font-size: 13.5px; color: #1a2e1a; }
.mono { font-family: monospace; font-size: 11.5px; word-break: break-all; }

.timeline { display: flex; flex-direction: column; }
.timeline-title { font-size: 11px; font-weight: 600; color: #94a894; text-transform: uppercase; letter-spacing: .07em; margin-bottom: 12px; }
.timeline-item { display: flex; align-items: flex-start; gap: 12px; padding-bottom: 16px; position: relative; }
.timeline-item:not(:last-child)::before { content: ''; position: absolute; left: 6px; top: 14px; width: 1px; height: calc(100% - 6px); background: #e2ede2; }
.tl-dot { width: 13px; height: 13px; border-radius: 50%; flex-shrink: 0; margin-top: 2px; border: 2px solid white; box-shadow: 0 0 0 1px currentColor; }
.tl-dot--green { background: #3d8c3d; color: #3d8c3d; }
.tl-dot--blue  { background: #2563eb; color: #2563eb; }
.tl-dot--red   { background: #dc2626; color: #dc2626; }
.tl-dot--amber { background: #d97706; color: #d97706; }
.tl-action { font-size: 13px; font-weight: 500; color: #1a2e1a; }
.tl-time { font-size: 11.5px; color: #94a894; margin-top: 2px; }

@media (max-width: 1024px) { .summary-row { grid-template-columns: repeat(3, 1fr); } }
@media (max-width: 768px)  { .summary-row { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 640px)  { .filter-bar { flex-direction: column; align-items: stretch; } .search-wrap { max-width: 100%; } }
</style>