<template>
  <div class="plans-page">

    <div class="page-header">
      <div>
        <h1 class="page-title">Gói cước</h1>
      </div>
    </div>

    <div v-if="loadingCurrent" class="current-plan-skeleton">
      <div class="sk-line sk-line--lg"></div>
      <div class="sk-line"></div>
      <div class="sk-line sk-line--sm"></div>
    </div>

    <div v-else-if="currentSub" class="current-plan-banner">
      <div class="cpb-left">
        <div class="cpb-tier" :style="{ background: planColor(currentSub.plan_id) }">
          {{ planTier(currentSub) }}
        </div>
        <div class="cpb-info">
          <div class="cpb-name">{{ currentSub.tenGoi }}</div>
          <div class="cpb-price">{{ fmtPrice(currentSub.giaTien) }}<span>/tháng</span></div>
        </div>
      </div>
      <div class="cpb-limits">
        <div class="cpb-limit-item">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>
          <span>{{ currentSub.gioiHanSoCho }} chợ</span>
        </div>
        <div class="cpb-limit-item">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></svg>
          <span>{{ currentSub.gioiHanSoKiosk }} kiosk</span>
        </div>
        <div class="cpb-limit-item">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
          <span>{{ currentSub.gioiHanUser }} user</span>
        </div>
      </div>
      <div class="cpb-right">
        <div class="cpb-status">
          <span class="badge badge--green">Đang hoạt động</span>
        </div>
        <div class="cpb-expiry" v-if="currentSub.ngayKetThuc">
          Hết hạn: <strong>{{ fmtDate(currentSub.ngayKetThuc) }}</strong>
        </div>
      </div>
    </div>

    <div v-else class="no-plan-banner">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
      Tài khoản của bạn chưa được gán gói cước. Vui lòng liên hệ Super Admin.
    </div>

    <div class="section-title">
      <h2>Các gói cước có sẵn</h2>
      <p>Chọn gói phù hợp để nâng cấp hạn mức và mở rộng quy mô hoạt động</p>
    </div>

    <div v-if="loadingPlans" class="plan-cards">
      <div v-for="i in 3" :key="i" class="plan-card skeleton-card">
        <div class="sk-line sk-line--sm"></div>
        <div class="sk-line sk-line--lg"></div>
        <div class="sk-line"></div>
        <div class="sk-line sk-line--sm"></div>
      </div>
    </div>

    <div v-else class="plan-cards">
      <div
        v-for="plan in plans"
        :key="plan.plan_id"
        :class="[
          'plan-card',
          isCurrentPlan(plan) ? 'plan-card--current' : '',
          isUpgrade(plan) ? 'plan-card--upgrade' : '',
          plan.trangThai !== 'active' ? 'plan-card--inactive' : ''
        ]"
      >
        <div class="plan-card-header">
          <div class="plan-tier-badge" :style="{ background: planColor(plan.plan_id) }">{{ planTier(plan) }}</div>
          <span v-if="isCurrentPlan(plan)" class="current-chip">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
            Gói hiện tại
          </span>
          <span v-else-if="plan.trangThai !== 'active'" class="badge badge--gray">Ngưng</span>
        </div>

        <div class="plan-name">{{ plan.tenGoi }}</div>

        <div class="plan-price">
          <span class="price-val">{{ fmtPrice(plan.giaTien) }}</span>
          <span class="price-period">/ tháng</span>
        </div>

        <div class="plan-limits">
          <div class="plan-limit-row">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>
            <span>{{ plan.gioiHanSoCho }} chợ</span>
          </div>
          <div class="plan-limit-row">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></svg>
            <span>{{ plan.gioiHanSoKiosk }} kiosk</span>
          </div>
          <div class="plan-limit-row">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
            <span>{{ plan.gioiHanUser }} user</span>
          </div>
        </div>

        <div class="plan-desc">{{ plan.moTa || 'Không có mô tả' }}</div>

        <div class="plan-card-footer">
          <div v-if="isCurrentPlan(plan)" class="plan-current-note">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
            Bạn đang dùng gói này
          </div>
          <button
            v-else-if="plan.trangThai === 'active' && isUpgrade(plan)"
            class="btn-upgrade"
            @click="openUpgrade(plan)"
            :disabled="checkingOut"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="17 11 12 6 7 11"/><line x1="12" y1="18" x2="12" y2="6"/></svg>
            Nâng cấp lên gói này
          </button>
          <button
            v-else-if="plan.trangThai === 'active' && isDowngrade(plan)"
            class="btn-downgrade"
            @click="openUpgrade(plan)"
            :disabled="checkingOut"
          >
            Chuyển sang gói này
          </button>
          <span v-else-if="plan.trangThai !== 'active'" class="plan-unavailable">Không khả dụng</span>
        </div>
      </div>
    </div>

    <div class="payment-history-section">
      <div class="section-title">
        <h2>Lịch sử thanh toán</h2>
      </div>
      <div class="table-panel">
        <table class="data-table">
          <thead>
            <tr>
              <th>Gói cước</th>
              <th>Trạng thái</th>
              <th>Ngày bắt đầu</th>
              <th>Ngày kết thúc</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loadingHistory"><td colspan="5"><div class="loading-bar"></div></td></tr>
            <tr v-for="s in history" :key="s.subscription_id">
              <td class="cell-name">{{ s.tenGoi || s.plan_id }}</td>
              <td>
                <span class="badge" :class="subStatusClass(s.trangThai)">{{ subStatusLabel(s.trangThai) }}</span>
              </td>
              <td class="cell-date">{{ fmtDate(s.ngayBatDau) }}</td>
              <td class="cell-date">{{ fmtDate(s.ngayKetThuc) }}</td>
            </tr>
            <tr v-if="!loadingHistory && !history.length">
              <td colspan="5" class="empty-row">Chưa có lịch sử thanh toán</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <Teleport to="body">
      <div v-if="upgradeModal" class="modal-overlay" @click.self="upgradeModal = false">
        <div class="modal">
          <div class="modal-header">
            <h3>Nâng cấp gói cước</h3>
            <button class="modal-close" @click="upgradeModal = false">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
          <div class="modal-body">

            <div class="upgrade-compare">
              <div class="uc-from">
                <div class="uc-label">Gói hiện tại</div>
                <div class="uc-name">{{ currentSub?.tenGoi || '—' }}</div>
                <div class="uc-price">{{ fmtPrice(currentSub?.giaTien ?? 0) }}<span>/tháng</span></div>
                <div class="uc-limits">
                  <span>{{ currentSub?.gioiHanSoCho }} chợ</span>
                  <span>{{ currentSub?.gioiHanSoKiosk }} kiosk</span>
                  <span>{{ currentSub?.gioiHanUser }} user</span>
                </div>
              </div>
              <div class="uc-arrow">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#3d8c3d" stroke-width="2.5"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
              </div>
              <div class="uc-to">
                <div class="uc-label">Gói mới</div>
                <div class="uc-name">{{ targetPlan?.tenGoi }}</div>
                <div class="uc-price uc-price--new">{{ fmtPrice(targetPlan?.giaTien ?? 0) }}<span>/tháng</span></div>
                <div class="uc-limits">
                  <span :class="(targetPlan?.gioiHanSoCho ?? 0) > (currentSub?.gioiHanSoCho ?? 0) ? 'limit--up' : ''">{{ targetPlan?.gioiHanSoCho }} chợ</span>
                  <span :class="(targetPlan?.gioiHanSoKiosk ?? 0) > (currentSub?.gioiHanSoKiosk ?? 0) ? 'limit--up' : ''">{{ targetPlan?.gioiHanSoKiosk }} kiosk</span>
                  <span :class="(targetPlan?.gioiHanUser ?? 0) > (currentSub?.gioiHanUser ?? 0) ? 'limit--up' : ''">{{ targetPlan?.gioiHanUser }} user</span>
                </div>
              </div>
            </div>


            <div class="field" v-if="!targetPlan?.stripe_price_id">
              <label>Stripe Price ID <span class="req">*</span></label>
              <input v-model="manualPriceId" placeholder="price_xxxxxxxxxxxxxxxx" />
              <span class="field-hint">Lấy từ Stripe Dashboard → Products → Prices</span>
            </div>

            <div class="error-banner" v-if="upgradeError">{{ upgradeError }}</div>
          </div>
          <div class="modal-footer">
            <button class="btn-ghost" @click="upgradeModal = false">Hủy</button>
            <button class="btn-upgrade-confirm" @click="proceedCheckout" :disabled="checkingOut">
              <span v-if="checkingOut" class="spin"></span>
              <svg v-else width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
              {{ checkingOut ? 'Đang xử lý thanh toán...' : 'Thanh toán' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import api from '@/api/axios'

const authStore = useAuthStore()

const loadingCurrent = ref(true)
const loadingPlans   = ref(true)
const loadingHistory = ref(true)
const checkingOut    = ref(false)
const upgradeModal   = ref(false)
const upgradeError   = ref('')
const manualPriceId  = ref('')

const currentSub = ref<any>(null)
const plans      = ref<any[]>([])
const history    = ref<any[]>([])
const targetPlan = ref<any>(null)

const tenantId = computed(() => authStore.user?.tenant_id)

onMounted(async () => {
  await Promise.all([fetchCurrentSub(), fetchPlans(), fetchHistory()])
})

async function fetchCurrentSub() {
  loadingCurrent.value = true
  try {
    const res = await api.get('/plan_subscription')
    if (res.data && res.data.trangThai === 'active') {
      currentSub.value = res.data
    } else {
      currentSub.value = null
    }
  } catch {
    currentSub.value = null
  } finally {
    loadingCurrent.value = false
  }
}

async function fetchPlans() {
  loadingPlans.value = true
  try {
    const res = await api.get('/plan?limit=50')
    plans.value = (res.data || []).filter((p: any) => p.trangThai === 'active' || isCurrentPlan(p))
  } catch {}
  finally { loadingPlans.value = false }
}

async function fetchHistory() {
  loadingHistory.value = true
  try {
    const res = await api.get('/plan_subscription/list?limit=20&sortOrder=DESC')
    history.value = res.data.data || res.data || []
  } catch {}
  finally { loadingHistory.value = false }
}

function isCurrentPlan(plan: any): boolean {
  return currentSub.value && currentSub.value.plan_id === plan.plan_id
}

function isUpgrade(plan: any): boolean {
  if (!currentSub.value) return true
  return (plan.giaTien ?? 0) > (currentSub.value.giaTien ?? 0)
}

function isDowngrade(plan: any): boolean {
  if (!currentSub.value) return false
  return (plan.giaTien ?? 0) < (currentSub.value.giaTien ?? 0)
}

function openUpgrade(plan: any) {
  targetPlan.value = plan
  manualPriceId.value = plan.stripe_price_id || ''
  upgradeError.value = ''
  upgradeModal.value = true
}

async function proceedCheckout() {
  if (!targetPlan.value) return

  const priceId = targetPlan.value.stripe_price_id || manualPriceId.value.trim()
  if (!priceId) {
    upgradeError.value = 'Vui lòng nhập Stripe Price ID'
    return
  }

  checkingOut.value = true
  upgradeError.value = ''

  try {
    const res = await api.post('/payment/checkout', {
      priceId,
      plan_id: targetPlan.value.plan_id,
    })

    if (res.data?.url) {
      window.location.href = res.data.url
    } else {
      upgradeError.value = 'Không nhận được URL thanh toán từ server'
    }
  } catch (e: any) {
    upgradeError.value = e.response?.data?.message || 'Lỗi khi tạo phiên thanh toán'
  } finally {
    checkingOut.value = false
  }
}

function fmtPrice(p: number): string {
  if (!p) return 'Miễn phí'
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(p)
}

function fmtDate(d: string): string {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function subStatusClass(s: string) {
  if (s === 'active') return 'badge--green'
  if (s === 'expired') return 'badge--red'
  if (s === 'pending') return 'badge--amber'
  return 'badge--gray'
}

function subStatusLabel(s: string) {
  const map: Record<string, string> = { active: 'Đang hoạt động', expired: 'Hết hạn', pending: 'Chờ thanh toán', cancelled: 'Đã hủy', trial: 'Dùng thử' }
  return map[s] || s
}

const tierColors: string[] = ['#e0f2fe', '#f0fdf4', '#fef3c7', '#f5f3ff', '#fff1f2']
function planColor(id: number): string { return tierColors[(id - 1) % tierColors.length] }
function planTier(plan: any): string {
  if (!plan) return '—'
  const g = plan.giaTien ?? 0
  if (g === 0) return 'Free'
  if (g < 300000) return 'Starter'
  if (g < 800000) return 'Pro'
  return 'Enterprise'
}
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@300;400;500;600&display=swap');
*, *::before, *::after { box-sizing: border-box; }

.plans-page { display: flex; flex-direction: column; gap: 24px; font-family: 'Be Vietnam Pro', sans-serif; }

.page-header { display: flex; justify-content: space-between; align-items: flex-start; }
.page-title { font-size: 22px; font-weight: 600; color: #1a2e1a; margin: 0 0 4px; letter-spacing: -.3px; }
.page-sub { font-size: 13px; color: #6b836b; margin: 0; }

.current-plan-skeleton { background: white; border: 1px solid #e2ede2; border-radius: 14px; padding: 22px; display: flex; flex-direction: column; gap: 10px; }
.sk-line { height: 14px; background: #f0f5f0; border-radius: 6px; animation: pulse 1.2s infinite; }
.sk-line--sm { width: 40%; }
.sk-line--lg { width: 60%; height: 22px; }
@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.5} }

.current-plan-banner {
  background: white;
  border: 2px solid #3d8c3d;
  border-radius: 14px;
  padding: 20px 22px;
  display: flex;
  align-items: center;
  gap: 20px;
  flex-wrap: wrap;
  box-shadow: 0 4px 16px rgba(180,230,50,0.15);
}
.cpb-left { display: flex; align-items: center; gap: 12px; }
.cpb-tier { font-size: 11px; font-weight: 600; padding: 5px 12px; border-radius: 20px; color: #374151; flex-shrink: 0; }
.cpb-name { font-size: 17px; font-weight: 600; color: #1a2e1a; margin-bottom: 2px; }
.cpb-price { font-size: 22px; font-weight: 700; color: #3d8c3d; }
.cpb-price span { font-size: 13px; font-weight: 400; color: #6b836b; margin-left: 2px; }
.cpb-limits { display: flex; gap: 14px; flex-wrap: wrap; flex: 1; justify-content: center; }
.cpb-limit-item { display: flex; align-items: center; gap: 6px; font-size: 13px; color: #2d4a2d; background: #f0ffd4; padding: 5px 12px; border-radius: 20px; }
.cpb-right { display: flex; flex-direction: column; align-items: flex-end; gap: 6px; }
.cpb-expiry { font-size: 12.5px; color: #6b836b; }
.cpb-expiry strong { color: #1a2e1a; }

.no-plan-banner { display: flex; align-items: center; gap: 10px; background: #fffbeb; border: 1px solid #fde68a; border-radius: 12px; padding: 14px 18px; color: #92400e; font-size: 13.5px; }

.section-title h2 { font-size: 16px; font-weight: 600; color: #1a2e1a; margin: 0 0 4px; }
.section-title p { font-size: 13px; color: #6b836b; margin: 0; }

.plan-cards { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 18px; }

.plan-card {
  background: white;
  border: 1px solid #e2ede2;
  border-radius: 16px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  transition: box-shadow 0.2s, border-color 0.2s;
}
.plan-card:hover { box-shadow: 0 4px 20px rgba(61,140,61,0.1); }
.plan-card--current { border: 2px solid #3d8c3d; background: #fafff0; }
.plan-card--upgrade { border-color: #3d8c3d; }
.plan-card--inactive { opacity: 0.6; }

.plan-card-header { display: flex; justify-content: space-between; align-items: center; }
.plan-tier-badge { font-size: 11px; font-weight: 600; padding: 4px 10px; border-radius: 20px; color: #374151; }
.current-chip { display: inline-flex; align-items: center; gap: 4px; font-size: 11.5px; font-weight: 600; background: #CCFF66; color: #1a3d00; padding: 3px 9px; border-radius: 20px; border: 1px solid #aadd33; }

.plan-name { font-size: 17px; font-weight: 600; color: #1a2e1a; }
.plan-price { display: flex; align-items: baseline; gap: 4px; }
.price-val { font-size: 24px; font-weight: 700; color: #3d8c3d; }
.price-period { font-size: 12.5px; color: #6b836b; }

.plan-limits { display: flex; flex-direction: column; gap: 5px; }
.plan-limit-row { display: flex; align-items: center; gap: 7px; font-size: 13px; color: #4a654a; }
.plan-limit-row svg { color: #7aaa30; flex-shrink: 0; }

.plan-desc { font-size: 12.5px; color: #6b836b; line-height: 1.5; flex: 1; }

.plan-card-footer { padding-top: 10px; border-top: 1px solid #f0f5f0; margin-top: 4px; }
.plan-current-note { display: flex; align-items: center; gap: 6px; font-size: 12.5px; color: #2d6e2d; font-weight: 500; }
.plan-unavailable { font-size: 12.5px; color: #94a894; }

.btn-upgrade {
  width: 100%;
  height: 38px;
  background: #3d8c3d;
  border: none;
  border-radius: 10px;
  color: white;
  font-size: 13px;
  font-weight: 600;
  font-family: 'Be Vietnam Pro', sans-serif;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  transition: background 0.15s;
}
.btn-upgrade:hover:not(:disabled) { background: #2d6e2d; }
.btn-upgrade:disabled { opacity: 0.55; cursor: not-allowed; }

.btn-downgrade {
  width: 100%;
  height: 38px;
  background: white;
  border: 1.5px solid #d4e4d4;
  border-radius: 10px;
  color: #4a654a;
  font-size: 13px;
  font-family: 'Be Vietnam Pro', sans-serif;
  cursor: pointer;
  transition: background 0.15s;
}
.btn-downgrade:hover:not(:disabled) { background: #f0f7f0; }

.skeleton-card { min-height: 240px; }

.payment-history-section { display: flex; flex-direction: column; gap: 12px; }
.table-panel { background: white; border: 1px solid #e2ede2; border-radius: 14px; overflow: hidden; }
.data-table { width: 100%; border-collapse: collapse; }
.data-table th { padding: 10px 16px; font-size: 11px; font-weight: 600; color: #94a894; text-transform: uppercase; letter-spacing: .06em; text-align: left; background: #fafcfa; border-bottom: 1px solid #f0f5f0; }
.data-table td { padding: 12px 16px; border-bottom: 1px solid #f7faf7; vertical-align: middle; }
.data-table tbody tr:last-child td { border-bottom: none; }
.cell-name { font-size: 13.5px; font-weight: 500; color: #1a2e1a; }
.cell-date { font-size: 12.5px; color: #6b836b; white-space: nowrap; }
.cell-sub { font-size: 11.5px; color: #94a894; font-family: monospace; }
.empty-row { text-align: center; padding: 32px !important; color: #94a894; font-size: 13px; }
.loading-bar { height: 3px; background: linear-gradient(90deg,#eef7ee,#3d8c3d,#eef7ee); background-size: 200%; animation: shimmer 1.5s infinite; }
@keyframes shimmer { to { background-position: -200% center; } }

.badge { display: inline-flex; align-items: center; padding: 3px 8px; border-radius: 20px; font-size: 11.5px; font-weight: 500; }
.badge--green { background: #eef7ee; color: #2d6e2d; }
.badge--red { background: #fef2f2; color: #dc2626; }
.badge--amber { background: #fffbeb; color: #b45309; }
.badge--gray { background: #f4f4f4; color: #6b7280; }

.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 1rem; }
.modal { background: white; border-radius: 16px; width: 100%; max-width: 500px; max-height: 90vh; overflow-y: auto; box-shadow: 0 20px 60px rgba(0,0,0,0.15); }
.modal-header { display: flex; justify-content: space-between; align-items: center; padding: 18px 22px 14px; border-bottom: 1px solid #f0f5f0; }
.modal-header h3 { font-size: 15.5px; font-weight: 600; color: #1a2e1a; margin: 0; }
.modal-close { background: none; border: none; color: #94a894; cursor: pointer; display: flex; align-items: center; padding: 4px; border-radius: 6px; }
.modal-close:hover { background: #f0f5f0; }
.modal-body { padding: 20px 22px; display: flex; flex-direction: column; gap: 16px; }
.modal-footer { display: flex; justify-content: flex-end; gap: 10px; padding: 14px 22px; border-top: 1px solid #f0f5f0; }

.upgrade-compare { display: grid; grid-template-columns: 1fr auto 1fr; gap: 12px; align-items: center; background: #f7faf7; border-radius: 12px; padding: 16px; border: 1px solid #e2ede2; }
.uc-label { font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: .07em; color: #94a894; margin-bottom: 6px; }
.uc-name { font-size: 14px; font-weight: 600; color: #1a2e1a; margin-bottom: 3px; }
.uc-price { font-size: 18px; font-weight: 700; color: #6b836b; margin-bottom: 8px; }
.uc-price span { font-size: 11px; font-weight: 400; }
.uc-price--new { color: #3d8c3d; }
.uc-limits { display: flex; flex-direction: column; gap: 3px; }
.uc-limits span { font-size: 12px; color: #4a654a; background: #f0f5f0; padding: 2px 7px; border-radius: 20px; display: inline-block; margin-bottom: 2px; }
.limit--up { background: #eef7ee !important; color: #2d6e2d !important; font-weight: 500; }
.uc-arrow { display: flex; align-items: center; justify-content: center; }

.info-box { display: flex; align-items: flex-start; gap: 10px; background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 10px; padding: 12px 14px; font-size: 12.5px; color: #1e40af; line-height: 1.6; }
.info-box svg { flex-shrink: 0; margin-top: 1px; color: #2563eb; }

.field { display: flex; flex-direction: column; gap: 5px; }
.field label { font-size: 12.5px; font-weight: 500; color: #3a4f3a; }
.req { color: #dc2626; }
.field input { height: 40px; padding: 0 12px; border: 1.5px solid #d4e4d4; border-radius: 10px; font-size: 13.5px; font-family: 'Be Vietnam Pro', sans-serif; color: #1a2e1a; background: #fbfdfb; outline: none; transition: border .2s; }
.field input:focus { border-color: #3d8c3d; background: white; }
.field-hint { font-size: 11.5px; color: #94a894; }

.btn-ghost { height: 40px; padding: 0 18px; background: none; border: 1px solid #e2ede2; border-radius: 10px; color: #4a654a; font-size: 13.5px; font-family: 'Be Vietnam Pro', sans-serif; cursor: pointer; }
.btn-ghost:hover { background: #f7faf7; }

.btn-upgrade-confirm {
  display: inline-flex; align-items: center; gap: 8px;
  height: 40px; padding: 0 22px;
  background: #3d8c3d; border: none; border-radius: 10px;
  color: white; font-size: 13.5px; font-weight: 600;
  font-family: 'Be Vietnam Pro', sans-serif;
  cursor: pointer; transition: background 0.15s;
}
.btn-upgrade-confirm:hover:not(:disabled) { background: #2d6e2d; }
.btn-upgrade-confirm:disabled { opacity: 0.55; cursor: not-allowed; }

.error-banner { background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 10px 12px; color: #b91c1c; font-size: 13px; }

.spin { width: 14px; height: 14px; border: 2px solid rgba(255,255,255,.35); border-top-color: white; border-radius: 50%; animation: spin .65s linear infinite; display: inline-block; }
@keyframes spin { to { transform: rotate(360deg); } }
</style>