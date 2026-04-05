<template>
  <div class="plans-page">

    <div class="page-header">
      <div>
        <h1 class="page-title">Quản lý Gói cước</h1>
        <p class="page-sub">Tạo và quản lý các gói cước dịch vụ</p>
      </div>
      <button class="btn-primary" @click="openCreate">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        Tạo Plan mới
      </button>
    </div>

    <div class="filter-bar">
      <div class="search-wrap">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <input v-model="filters.keyword" placeholder="Tìm kiếm plan..." @input="debouncedFetch" />
      </div>
      <select v-model="filters.trangThai" @change="fetchPlans">
        <option value="">Tất cả trạng thái</option>
        <option value="active">Đang hoạt động</option>
        <option value="inactive">Ngưng hoạt động</option>
      </select>
    </div>

    <div class="plan-cards" v-if="!loading && plans.length">
      <div v-for="plan in plans" :key="plan.plan_id" class="plan-card" :class="{ 'plan-card--featured': plan.isFeatured }">
        <div class="plan-card-header">
          <div class="plan-tier-badge" :style="{ background: planColor(plan.plan_id) }">{{ planTier(plan) }}</div>
          <span class="badge" :class="plan.trangThai === 'active' ? 'badge--green' : 'badge--red'">{{ plan.trangThai }}</span>
        </div>
        <div class="plan-name">{{ plan.tenGoi }}</div>
        <div class="plan-price">
          <span class="price-val">{{ fmtPrice(plan.giaTien) }}</span>
          <span class="price-period">/ tháng</span>
        </div>
        <div class="plan-limits">
          <span class="limit-chip">{{ plan.gioiHanSoCho }} chợ</span>
          <span class="limit-chip">{{ plan.gioiHanSoKiosk }} kiosk</span>
          <span class="limit-chip">{{ plan.gioiHanUser }} user</span>
        </div>
        <div class="plan-desc">{{ plan.moTa || 'Không có mô tả' }}</div>
        <div class="plan-card-actions">
          <button class="btn-outline-sm" @click="openEdit(plan)">Chỉnh sửa</button>
          <button v-if="plan.trangThai === 'active'" class="btn-assign-sm" @click="openAssign(plan)">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>
            Gán Tenant
          </button>
          <button v-if="plan.trangThai === 'active'" class="btn-danger-sm" @click="confirmInactive(plan)">Ngưng</button>
          <span v-else class="badge badge--gray">Đã ngưng</span>
        </div>
      </div>
    </div>

    <div v-if="loading" class="plan-cards">
      <div v-for="i in 3" :key="i" class="plan-card skeleton-card">
        <div class="sk-line sk-line--sm"></div>
        <div class="sk-line sk-line--lg"></div>
        <div class="sk-line"></div>
        <div class="sk-line sk-line--sm"></div>
      </div>
    </div>

    <div v-if="!loading && !plans.length" class="empty-state">
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#b0c4b0" stroke-width="1.5"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
      <p>Chưa có gói cước nào</p>
      <button class="btn-primary" @click="openCreate">Tạo Plan đầu tiên</button>
    </div>

    <div class="pagination" v-if="meta.totalPages > 1">
      <button :disabled="filters.page <= 1" @click="changePage(filters.page - 1)">←</button>
      <span>Trang {{ filters.page }} / {{ meta.totalPages }}</span>
      <button :disabled="filters.page >= meta.totalPages" @click="changePage(filters.page + 1)">→</button>
    </div>

    <Teleport to="body">

      <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
        <div class="modal">
          <div class="modal-header">
            <h3>{{ editingPlan ? 'Cập nhật Plan' : 'Tạo Plan mới' }}</h3>
            <button class="modal-close" @click="closeModal">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
          <div class="modal-body">
            <div class="form-row">
              <div class="field">
                <label>Tên gói <span class="req">*</span></label>
                <input v-model="form.tenGoi" placeholder="Ví dụ: Gói Pro" />
              </div>
              <div class="field">
                <label>Giá (VNĐ/tháng) <span class="req">*</span></label>
                <input v-model.number="form.giaTien" type="number" placeholder="500000" min="0" />
              </div>
            </div>
            <div class="field">
              <label>Mô tả</label>
              <textarea v-model="form.moTa" rows="3" placeholder="Mô tả ngắn về gói cước..."></textarea>
            </div>
            <div class="form-row">
              <div class="field">
                <label>Giới hạn Kiosk</label>
                <input v-model.number="form.gioiHanSoKiosk" type="number" placeholder="500" min="0" />
              </div>
              <div class="field">
                <label>Giới hạn Chợ</label>
                <input v-model.number="form.gioiHanSoCho" type="number" placeholder="10" min="0" />
              </div>
            </div>
            <div class="field">
              <label>Giới hạn người dùng</label>
              <input v-model.number="form.gioiHanUser" type="number" placeholder="50" min="0" />
            </div>
            <div class="field">
              <label>Stripe Price ID</label>
              <input v-model="form.stripe_price_id" placeholder="price_xxxxxxxxxxxxxxxx" />
            </div>
            <div class="error-banner" v-if="formError">{{ formError }}</div>
          </div>
          <div class="modal-footer">
            <button class="btn-ghost" @click="closeModal">Hủy</button>
            <button class="btn-primary" @click="submitPlan" :disabled="saving">
              <span v-if="saving" class="spin"></span>
              {{ saving ? 'Đang lưu...' : (editingPlan ? 'Cập nhật' : 'Tạo Plan') }}
            </button>
          </div>
        </div>
      </div>

      <div v-if="confirmModal" class="modal-overlay" @click.self="confirmModal = false">
        <div class="modal modal--sm">
          <div class="modal-header">
            <h3>Ngưng gói cước</h3>
            <button class="modal-close" @click="confirmModal = false">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
          <div class="modal-body">
            <p>Bạn có chắc muốn ngưng gói <strong>{{ targetPlan?.tenGoi }}</strong>? Tenant đang dùng gói này sẽ không bị ảnh hưởng ngay lập tức.</p>
          </div>
          <div class="modal-footer">
            <button class="btn-ghost" @click="confirmModal = false">Hủy</button>
            <button class="btn-danger" @click="doInactive" :disabled="saving">
              <span v-if="saving" class="spin spin-dark"></span>
              Xác nhận ngưng
            </button>
          </div>
        </div>
      </div>

      <div v-if="assignModal" class="modal-overlay" @click.self="assignModal = false">
        <div class="modal modal--md">
          <div class="modal-header">
            <h3>Gán gói cước cho Tenant</h3>
            <button class="modal-close" @click="assignModal = false">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
          <div class="modal-body">
            <div class="assign-plan-preview">
              <div class="app-tier" :style="{ background: planColor(assigningPlan?.plan_id ?? 1) }">
                {{ planTier(assigningPlan ?? {}) }}
              </div>
              <div class="app-info">
                <div class="app-name">{{ assigningPlan?.tenGoi }}</div>
                <div class="app-price">{{ fmtPrice(assigningPlan?.giaTien ?? 0) }}<span>/tháng</span></div>
              </div>
              <div class="app-limits">
                <span>{{ assigningPlan?.gioiHanSoCho }} chợ</span>
                <span>{{ assigningPlan?.gioiHanSoKiosk }} kiosk</span>
                <span>{{ assigningPlan?.gioiHanUser }} user</span>
              </div>
            </div>

            <div class="field">
              <label>Chọn Tenant <span class="req">*</span></label>
              <div class="search-tenant-wrap">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                <input v-model="tenantSearch" placeholder="Tìm tên hoặc email tenant..." />
              </div>
              <div v-if="loadingAssigned" class="tenant-msg" style="border: 1px solid #e2ede2; border-radius: 10px;">
                Đang kiểm tra danh sách đã gán...
              </div>
              <div class="tenant-list-wrap" v-else>
                <div v-if="loadingTenants" class="tenant-msg">Đang tải danh sách tenant...</div>
                <div
                  v-for="t in filteredTenants"
                  :key="t.tenant_id"
                  class="tenant-option"
                  :class="{ 'tenant-option--selected': assignForm.tenant_id === t.tenant_id }"
                  @click="assignForm.tenant_id = t.tenant_id"
                >
                  <div class="to-avatar">{{ ini(t.tenBanQuanLy) }}</div>
                  <div class="to-info">
                    <div class="to-name">{{ t.tenBanQuanLy }}</div>
                    <div class="to-email">{{ t.email }}</div>
                  </div>
                  <span class="badge" :class="t.trangThai === 'active' ? 'badge--green' : 'badge--red'" style="flex-shrink:0">
                    {{ t.trangThai === 'active' ? 'Hoạt động' : 'Khóa' }}
                  </span>
                  <svg v-if="assignForm.tenant_id === t.tenant_id" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#3d8c3d" stroke-width="2.5" style="flex-shrink:0"><polyline points="20 6 9 17 4 12"/></svg>
                </div>
                <div v-if="!loadingTenants && filteredTenants.length === 0" class="tenant-msg">Không tìm thấy tenant</div>
              </div>
            </div>

            <div class="error-banner" v-if="assignError">{{ assignError }}</div>
            <div class="success-banner" v-if="assignSuccess">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
              Gán plan thành công!
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn-ghost" @click="assignModal = false">Đóng</button>
            <button class="btn-assign" @click="submitAssign" :disabled="savingAssign || !assignForm.tenant_id">
              <span v-if="savingAssign" class="spin"></span>
              {{ savingAssign ? 'Đang gán...' : 'Xác nhận gán plan' }}
            </button>
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
const saving = ref(false)
const showModal = ref(false)
const confirmModal = ref(false)
const editingPlan = ref<any>(null)
const targetPlan = ref<any>(null)
const formError = ref('')
const plans = ref<any[]>([])
const meta = ref({ total: 0, totalPages: 1 })

const filters = reactive({ keyword: '', trangThai: '', page: 1, limit: 12, sortBy: 'created_at', sortOrder: 'DESC' })
const form = reactive({ tenGoi: '', giaTien: 0, moTa: '', gioiHanUser: 0, gioiHanSoKiosk: 0, gioiHanSoCho: 0, stripe_price_id: '' })

const assignModal = ref(false)
const assigningPlan = ref<any>(null)
const assignForm = reactive({ tenant_id: 0 })
const assignError = ref('')
const assignSuccess = ref(false)
const savingAssign = ref(false)
const tenantList = ref<any[]>([])
const tenantSearch = ref('')
const loadingTenants = ref(false)
const assignedTenantIds = ref<Set<number>>(new Set())
const loadingAssigned = ref(false)

const filteredTenants = computed(() => {
  const q = tenantSearch.value.trim().toLowerCase()
  return tenantList.value.filter(t => {
    if (assignedTenantIds.value.has(t.tenant_id)) return false
    if (!q) return true
    return t.tenBanQuanLy?.toLowerCase().includes(q) || t.email?.toLowerCase().includes(q)
  })
})

let debounceTimer: any
function debouncedFetch() { clearTimeout(debounceTimer); debounceTimer = setTimeout(fetchPlans, 400) }

onMounted(async () => {
  await fetchPlans()
  loadingTenants.value = true
  try {
    const res = await api.get('/tenant?limit=200')
    tenantList.value = res.data || []
  } catch {}
  finally { loadingTenants.value = false }
})


async function fetchPlans() {
  loading.value = true
  try {
    const params = new URLSearchParams({ ...filters, page: String(filters.page), limit: String(filters.limit) } as any)
    const res = await api.get(`/plan/list?${params}`)
    plans.value = res.data.data || []
    meta.value = res.data.pagination || { total: 0, totalPages: 1 }
  } catch {}
  finally { loading.value = false }
}

function changePage(p: number) { filters.page = p; fetchPlans() }

function openCreate() {
  editingPlan.value = null
  Object.assign(form, { tenGoi: '', giaTien: 0, moTa: '', gioiHanUser: 0, gioiHanSoKiosk: 0, gioiHanSoCho: 0, stripe_price_id: '' })
  formError.value = ''
  showModal.value = true
}

async function openEdit(plan: any) {
  formError.value = ''
  editingPlan.value = plan
  Object.assign(form, {
    tenGoi: plan.tenGoi ?? '',
    giaTien: plan.giaTien ?? 0,
    moTa: plan.moTa ?? '',
    gioiHanUser: plan.gioiHanUser ?? 0,
    gioiHanSoKiosk: plan.gioiHanSoKiosk ?? 0,
    gioiHanSoCho: plan.gioiHanSoCho ?? 0,
    stripe_price_id: plan.stripe_price_id ?? '',
  })
  showModal.value = true
  try {
    const res = await api.get(`/plan/${plan.plan_id}`)
    const p = res.data
    Object.assign(form, {
      tenGoi: p.tenGoi ?? form.tenGoi,
      giaTien: p.giaTien !== undefined ? p.giaTien : form.giaTien,
      moTa: p.moTa ?? form.moTa,
      gioiHanUser: p.gioiHanUser !== undefined ? p.gioiHanUser : form.gioiHanUser,
      gioiHanSoKiosk: p.gioiHanSoKiosk !== undefined ? p.gioiHanSoKiosk : form.gioiHanSoKiosk,
      gioiHanSoCho: p.gioiHanSoCho !== undefined ? p.gioiHanSoCho : form.gioiHanSoCho,
    })
  } catch {}
}

function closeModal() { showModal.value = false }

async function openAssign(plan: any) {
  assigningPlan.value = plan
  assignForm.tenant_id = 0
  tenantSearch.value = ''
  assignError.value = ''
  assignSuccess.value = false
  assignModal.value = true

  loadingAssigned.value = true
  try {
    const res = await api.get(`/plan_subscription/list?plan_id=${plan.plan_id}&trangThai=active&limit=200`)
    const rows = res.data?.data || []
    assignedTenantIds.value = new Set(rows.map((r: any) => r.tenant_id))
  } catch {
    assignedTenantIds.value = new Set()
  } finally {
    loadingAssigned.value = false
  }
}

function confirmInactive(plan: any) { targetPlan.value = plan; confirmModal.value = true }

async function submitPlan() {
  if (!form.tenGoi || !form.giaTien) { formError.value = 'Vui lòng điền tên và giá gói'; return }
  saving.value = true; formError.value = ''
  try {
    const payload = {
      tenGoi: form.tenGoi,
      giaTien: form.giaTien,
      moTa: form.moTa || null,
      gioiHanUser: form.gioiHanUser,
      gioiHanSoKiosk: form.gioiHanSoKiosk,
      gioiHanSoCho: form.gioiHanSoCho,
      stripe_price_id: form.stripe_price_id || null, 
    }
    if (editingPlan.value) {
      await api.put(`/plan/${editingPlan.value.plan_id}`, payload)
    } else {
      await api.post('/plan', payload)
    }
    closeModal()
    fetchPlans()
  } catch (e: any) {
    formError.value = e.response?.data?.message || 'Lỗi khi lưu plan'
  } finally { saving.value = false }
}

async function doInactive() {
  if (!targetPlan.value) return
  saving.value = true
  try {
    await api.patch(`/plan/${targetPlan.value.plan_id}/inactive`)
    confirmModal.value = false
    fetchPlans()
  } catch (e: any) {
    formError.value = e.response?.data?.message || 'Lỗi'
  } finally { saving.value = false }
}

async function submitAssign() {
  if (!assignForm.tenant_id || !assigningPlan.value) return
  savingAssign.value = true
  assignError.value = ''
  assignSuccess.value = false
  try {
    await api.post('/plan_subscription', {
      tenant_id: assignForm.tenant_id,
      plan_id: assigningPlan.value.plan_id,
    })
    assignedTenantIds.value.add(assignForm.tenant_id)
    
    assignSuccess.value = true
    assignForm.tenant_id = 0
    tenantSearch.value = ''
    setTimeout(() => { assignSuccess.value = false }, 3000)
  } catch (e: any) {
    assignError.value = e.response?.data?.message || 'Lỗi khi gán plan. Tenant có thể đã có gói đang hoạt động.'
  } finally { savingAssign.value = false }
}

function fmtPrice(p: number): string {
  if (!p) return 'Miễn phí'
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(p)
}

function ini(name: string): string {
  return (name || '?').split(' ').map((w: string) => w[0]).slice(-2).join('').toUpperCase()
}

const tierColors: string[] = ['#e0f2fe', '#f0fdf4', '#fef3c7', '#f5f3ff', '#fff1f2']
function planColor(id: number): string { return tierColors[(id - 1) % tierColors.length] }
function planTier(plan: any): string {
  if (!plan || plan.giaTien === 0) return 'Free'
  if (plan.giaTien < 300000) return 'Starter'
  if (plan.giaTien < 800000) return 'Pro'
  return 'Enterprise'
}
</script>

<style scoped>
.plans-page { display: flex; flex-direction: column; gap: 20px; }
.page-header { display: flex; justify-content: space-between; align-items: flex-start; }
.page-title { font-size: 22px; font-weight: 600; color: #1a2e1a; margin: 0 0 4px; letter-spacing: -0.3px; }
.page-sub { font-size: 13.5px; color: #6b836b; margin: 0; }

.filter-bar { display: flex; gap: 12px; align-items: center; }
.search-wrap { flex: 1; max-width: 360px; position: relative; display: flex; align-items: center; }
.search-wrap svg { position: absolute; left: 12px; color: #94a894; }
.search-wrap input { width: 100%; height: 40px; padding: 0 12px 0 36px; border: 1.5px solid #d4e4d4; border-radius: 10px; font-size: 13.5px; font-family: 'Be Vietnam Pro', sans-serif; color: #1a2e1a; background: white; outline: none; }
.search-wrap input:focus { border-color: #3d8c3d; }
select { height: 40px; padding: 0 12px; border: 1.5px solid #d4e4d4; border-radius: 10px; font-size: 13.5px; font-family: 'Be Vietnam Pro', sans-serif; color: #1a2e1a; background: white; outline: none; min-width: 160px; }

.plan-cards { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 20px; }

.plan-card { background: white; border: 1px solid #e2ede2; border-radius: 16px; padding: 22px; display: flex; flex-direction: column; gap: 10px; transition: box-shadow 0.2s; }
.plan-card:hover { box-shadow: 0 4px 20px rgba(61,140,61,0.1); }
.plan-card--featured { border-color: #3d8c3d; border-width: 2px; }

.plan-card-header { display: flex; justify-content: space-between; align-items: center; }
.plan-tier-badge { font-size: 11px; font-weight: 600; padding: 4px 10px; border-radius: 20px; color: #374151; }

.plan-name { font-size: 18px; font-weight: 600; color: #1a2e1a; }
.plan-price { display: flex; align-items: baseline; gap: 4px; }
.price-val { font-size: 26px; font-weight: 700; color: #3d8c3d; }
.price-period { font-size: 13px; color: #6b836b; }

.plan-limits { display: flex; gap: 6px; flex-wrap: wrap; }
.limit-chip { font-size: 11.5px; background: #f0f7f0; color: #2d6e2d; padding: 3px 8px; border-radius: 20px; font-weight: 500; }

.plan-desc { font-size: 13px; color: #6b836b; line-height: 1.5; flex: 1; }

.plan-card-actions { display: flex; gap: 7px; align-items: center; flex-wrap: wrap; padding-top: 10px; border-top: 1px solid #f0f5f0; margin-top: 4px; }

.skeleton-card { min-height: 280px; }
.sk-line { height: 14px; background: #f0f5f0; border-radius: 6px; animation: pulse 1.2s infinite; margin-bottom: 10px; }
.sk-line--sm { width: 40%; }
.sk-line--lg { width: 60%; height: 22px; }
@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.5} }

.empty-state { text-align: center; padding: 64px 24px; display: flex; flex-direction: column; align-items: center; gap: 12px; color: #94a894; }
.empty-state p { font-size: 14px; margin: 0; }

.pagination { display: flex; align-items: center; gap: 12px; justify-content: center; padding: 8px 0; }
.pagination button { height: 36px; padding: 0 16px; background: white; border: 1px solid #e2ede2; border-radius: 8px; cursor: pointer; font-size: 13px; transition: background 0.15s; }
.pagination button:hover:not(:disabled) { background: #f0f7f0; }
.pagination button:disabled { opacity: 0.4; cursor: not-allowed; }
.pagination span { font-size: 13px; color: #6b836b; }

.btn-primary { display: inline-flex; align-items: center; gap: 7px; height: 40px; padding: 0 18px; background: #3d8c3d; border: none; border-radius: 10px; color: white; font-size: 13.5px; font-weight: 500; font-family: 'Be Vietnam Pro', sans-serif; cursor: pointer; transition: background 0.15s; }
.btn-primary:hover:not(:disabled) { background: #2d6e2d; }
.btn-primary:disabled { opacity: 0.55; cursor: not-allowed; }

.btn-outline-sm { height: 32px; padding: 0 12px; background: white; border: 1px solid #d4e4d4; border-radius: 8px; color: #2d4a2d; font-size: 12.5px; font-family: 'Be Vietnam Pro', sans-serif; cursor: pointer; transition: background 0.15s; }
.btn-outline-sm:hover { background: #f0f7f0; }

.btn-assign-sm { height: 32px; padding: 0 10px; background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; color: #1d4ed8; font-size: 12.5px; font-family: 'Be Vietnam Pro', sans-serif; cursor: pointer; display: inline-flex; align-items: center; gap: 5px; transition: background 0.15s; }
.btn-assign-sm:hover { background: #dbeafe; }

.btn-danger-sm { height: 32px; padding: 0 12px; background: white; border: 1px solid #fecaca; border-radius: 8px; color: #dc2626; font-size: 12.5px; font-family: 'Be Vietnam Pro', sans-serif; cursor: pointer; transition: background 0.15s; }
.btn-danger-sm:hover { background: #fef2f2; }

.btn-danger { display: inline-flex; align-items: center; gap: 7px; height: 40px; padding: 0 18px; background: #dc2626; border: none; border-radius: 10px; color: white; font-size: 13.5px; font-weight: 500; font-family: 'Be Vietnam Pro', sans-serif; cursor: pointer; }
.btn-danger:disabled { opacity: 0.55; cursor: not-allowed; }

.btn-assign { display: inline-flex; align-items: center; gap: 7px; height: 40px; padding: 0 20px; background: #3d8c3d; border: none; border-radius: 10px; color: white; font-size: 13.5px; font-weight: 500; font-family: 'Be Vietnam Pro', sans-serif; cursor: pointer; transition: background 0.15s; }
.btn-assign:hover:not(:disabled) { background: #2d6e2d; }
.btn-assign:disabled { opacity: 0.55; cursor: not-allowed; }

.btn-ghost { height: 40px; padding: 0 18px; background: none; border: 1px solid #e2ede2; border-radius: 10px; color: #4a654a; font-size: 13.5px; font-family: 'Be Vietnam Pro', sans-serif; cursor: pointer; transition: background 0.15s; }
.btn-ghost:hover { background: #f7faf7; }

.badge { display: inline-flex; align-items: center; padding: 3px 8px; border-radius: 20px; font-size: 11.5px; font-weight: 500; }
.badge--green { background: #eef7ee; color: #2d6e2d; }
.badge--red { background: #fef2f2; color: #dc2626; }
.badge--gray { background: #f4f4f4; color: #6b7280; }

.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 1rem; }
.modal { background: white; border-radius: 16px; width: 100%; max-width: 520px; max-height: 90vh; overflow-y: auto; box-shadow: 0 20px 60px rgba(0,0,0,0.15); }
.modal--sm { max-width: 400px; }
.modal--md { max-width: 480px; }

.modal-header { display: flex; justify-content: space-between; align-items: center; padding: 18px 22px 14px; border-bottom: 1px solid #f0f5f0; }
.modal-header h3 { font-size: 15.5px; font-weight: 600; color: #1a2e1a; margin: 0; }
.modal-close { background: none; border: none; color: #94a894; cursor: pointer; display: flex; align-items: center; padding: 4px; border-radius: 6px; }
.modal-close:hover { background: #f0f5f0; color: #4a654a; }
.modal-body { padding: 18px 22px; display: flex; flex-direction: column; gap: 14px; }
.modal-body p { font-size: 14px; color: #4a654a; line-height: 1.6; margin: 0; }
.modal-footer { display: flex; justify-content: flex-end; gap: 10px; padding: 14px 22px; border-top: 1px solid #f0f5f0; }

.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
.field { display: flex; flex-direction: column; gap: 6px; }
.field label { font-size: 12.5px; font-weight: 500; color: #3a4f3a; }
.req { color: #dc2626; }
.field input, .field textarea { width: 100%; padding: 9px 12px; border: 1.5px solid #d4e4d4; border-radius: 10px; font-size: 13.5px; font-family: 'Be Vietnam Pro', sans-serif; color: #1a2e1a; background: #fbfdfb; outline: none; transition: border 0.2s; resize: vertical; box-sizing: border-box; }
.field input:focus, .field textarea:focus { border-color: #3d8c3d; background: white; }

.assign-plan-preview { background: #f7faf7; border: 1px solid #e2ede2; border-radius: 11px; padding: 14px 16px; display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
.app-tier { font-size: 11px; font-weight: 600; padding: 4px 10px; border-radius: 20px; color: #374151; flex-shrink: 0; }
.app-info { flex: 1; min-width: 80px; }
.app-name { font-size: 15px; font-weight: 600; color: #1a2e1a; margin-bottom: 2px; }
.app-price { font-size: 18px; font-weight: 700; color: #3d8c3d; }
.app-price span { font-size: 12px; font-weight: 400; color: #6b836b; }
.app-limits { display: flex; gap: 5px; flex-wrap: wrap; }
.app-limits span { font-size: 11px; background: #eef7ee; color: #2d6e2d; padding: 2px 7px; border-radius: 20px; font-weight: 500; }

.search-tenant-wrap { position: relative; display: flex; align-items: center; }
.search-tenant-wrap svg { position: absolute; left: 11px; color: #94a894; pointer-events: none; }
.search-tenant-wrap input { width: 100%; height: 38px; padding: 0 12px 0 33px; border: 1.5px solid #d4e4d4; border-radius: 10px; font-size: 13px; font-family: 'Be Vietnam Pro', sans-serif; color: #1a2e1a; background: white; outline: none; box-sizing: border-box; }
.search-tenant-wrap input:focus { border-color: #3d8c3d; }

.tenant-list-wrap { border: 1px solid #e2ede2; border-radius: 10px; max-height: 200px; overflow-y: auto; background: white; }
.tenant-msg { padding: 18px; text-align: center; font-size: 13px; color: #94a894; }

.tenant-option { display: flex; align-items: center; gap: 10px; padding: 10px 14px; cursor: pointer; border-bottom: 1px solid #f7faf7; transition: background 0.15s; }
.tenant-option:last-child { border-bottom: none; }
.tenant-option:hover { background: #fafcfa; }
.tenant-option--selected { background: #f0f7f0; }

.to-avatar { width: 32px; height: 32px; background: #eef7ee; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 600; color: #2d6e2d; flex-shrink: 0; }
.to-info { flex: 1; min-width: 0; }
.to-name { font-size: 13px; font-weight: 500; color: #1a2e1a; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.to-email { font-size: 11.5px; color: #94a894; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

.info-note { display: flex; align-items: flex-start; gap: 8px; background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 10px 12px; font-size: 12.5px; color: #1e40af; line-height: 1.5; }
.info-note svg { flex-shrink: 0; margin-top: 1px; }

.error-banner { background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 10px 12px; color: #b91c1c; font-size: 13px; }
.success-banner { background: #eef7ee; border: 1px solid #d4e4d4; border-radius: 8px; padding: 10px 12px; color: #2d6e2d; font-size: 13px; display: flex; align-items: center; gap: 7px; }

.spin { width: 14px; height: 14px; border: 2px solid rgba(255,255,255,0.35); border-top-color: white; border-radius: 50%; animation: spin 0.65s linear infinite; display: inline-block; }
.spin-dark { border: 2px solid rgba(0,0,0,0.12); border-top-color: #dc2626; }
@keyframes spin { to { transform: rotate(360deg); } }
</style>