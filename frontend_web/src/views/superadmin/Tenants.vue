<template>
  <div class="tenants-page">

    <div class="page-header">
      <div>
        <h1 class="page-title">Quản lý Tenant</h1>
        <p class="page-sub">Tổng cộng {{ pagination.total }} tenant trong hệ thống</p>
      </div>
      <button class="btn-primary" @click="openCreate">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        Tạo Tenant
      </button>
    </div>

    <div v-if="fetchError" class="error-banner">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
      {{ fetchError }}
    </div>

    <div class="filter-bar">
      <div class="search-wrap">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <input v-model="filters.keyword" placeholder="Tìm theo tên, email..." @input="debouncedFetch" />
      </div>
      <select v-model="filters.trangThai" @change="fetchTenants">
        <option value="">Tất cả trạng thái</option>
        <option value="active">Hoạt động</option>
        <option value="suspended">Đã khóa</option>
      </select>
      <input type="date" v-model="filters.created_from" @change="fetchTenants" class="date-input" title="Từ ngày" />
      <input type="date" v-model="filters.created_to" @change="fetchTenants" class="date-input" title="Đến ngày" />
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
              <th>Tên Tenant</th>
              <th>Email</th>
              <th>Số điện thoại</th>
              <th>Địa chỉ</th>
              <th>Trạng thái</th>
              <th>Ngày tạo</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading">
              <td colspan="7"><div class="loading-bar"></div></td>
            </tr>
            <template v-else>
              <tr v-for="t in tenants" :key="t.tenant_id">
                <td>
                  <div class="cell-with-avatar">
                    <div class="avatar-sq" :style="{ background: avatarBg(t.tenBanQuanLy) }">
                      {{ initials(t.tenBanQuanLy) }}
                    </div>
                    <div class="cell-main">{{ t.tenBanQuanLy }}</div>
                  </div>
                </td>
                <td class="cell-sub">{{ t.email }}</td>
                <td class="cell-sub">{{ t.soDienThoai }}</td>
                <td class="cell-sub">{{ t.diaChi || '—' }}</td>
                <td>
                  <span class="badge" :class="t.trangThai === 'active' ? 'badge--green' : 'badge--red'">
                    {{ t.trangThai === 'active' ? 'Hoạt động' : 'Đã khóa' }}
                  </span>
                </td>
                <td class="cell-date">{{ fmtDate(t.created_at) }}</td>
                <td>
                  <div class="action-btns">
                    <button class="icon-btn" title="Chỉnh sửa" @click="openEdit(t)">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    </button>
                    <button
                      class="icon-btn"
                      :class="t.trangThai === 'active' ? 'icon-btn--danger' : 'icon-btn--success'"
                      :title="t.trangThai === 'active' ? 'Khóa tenant' : 'Mở khóa'"
                      @click="toggleStatus(t)"
                    >
                      <svg v-if="t.trangThai === 'active'" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                      <svg v-else width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/></svg>
                    </button>
                    <button class="icon-btn" title="Gán plan" @click="openAssignPlan(t)">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
                    </button>
                  </div>
                </td>
              </tr>
              <tr v-if="!tenants.length">
                <td colspan="7" class="empty-row">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#b0c4b0" stroke-width="1.5"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>
                  <p>Không có tenant nào</p>
                </td>
              </tr>
            </template>
          </tbody>
        </table>
      </div>

      <div class="table-foot">
        <span class="total-label">{{ pagination.total }} kết quả</span>
        <div class="pagination" v-if="pagination.totalPages > 1">
          <button :disabled="filters.page <= 1" @click="changePage(filters.page - 1)">← Trước</button>
          <span>{{ filters.page }} / {{ pagination.totalPages }}</span>
          <button :disabled="filters.page >= pagination.totalPages" @click="changePage(filters.page + 1)">Tiếp →</button>
        </div>
      </div>
    </div>

    <Teleport to="body">
      <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
        <div class="modal">
          <div class="modal-header">
            <h3>{{ editingTenant ? 'Cập nhật Tenant' : 'Tạo Tenant mới' }}</h3>
            <button class="modal-close" @click="closeModal">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>

          <div class="modal-body">
            <div class="section-label">Thông tin Tenant</div>
            <div class="form-row">
              <div class="field">
                <label>Tên Ban Quản Lý <span class="req">*</span></label>
                <input v-model="form.tenBanQuanLy" placeholder="Chợ Bến Thành" />
              </div>
              <div class="field">
                <label>Email <span class="req">*</span></label>
                <input v-model="form.email" type="email" placeholder="contact@cho.vn" />
              </div>
            </div>
            <div class="form-row">
              <div class="field">
                <label>Số điện thoại <span class="req">*</span></label>
                <input v-model="form.soDienThoai" placeholder="0281234567" />
              </div>
              <div class="field">
                <label>Địa chỉ <span class="req">*</span></label>
                <input v-model="form.diachi" placeholder="123 Lê Lợi, Q1, TP.HCM" />
              </div>
            </div>

            <div class="section-label" style="margin-top:4px">Thông tin doanh nghiệp</div>
            <div class="form-row">
              <div class="field">
                <label>Mã số thuế <span class="req">*</span></label>
                <input v-model="form.maSoThue" placeholder="0101234567" />
              </div>
              <div class="field">
                <label>Tên công ty</label>
                <input v-model="form.tenCongTy" placeholder="Công ty TNHH Quản lý Chợ" />
              </div>
            </div>
            <div class="form-row">
              <div class="field">
                <label>Người đại diện</label>
                <input v-model="form.nguoiDaiDien" placeholder="Nguyễn Văn A" />
              </div>
              <div class="field">
                <label>Chức vụ</label>
                <input v-model="form.chucVu" placeholder="Giám đốc" />
              </div>
            </div>
            <div class="form-row">
              <div class="field">
                <label>Giấy phép kinh doanh</label>
                <input v-model="form.giayPhepKinhDoanh" placeholder="GPKD số 12345" />
              </div>
              <div class="field">
                <label>Ngày cấp phép</label>
                <input v-model="form.ngayCapPhep" type="date" />
              </div>
            </div>
            <div class="field">
              <label>Nơi cấp phép</label>
              <input v-model="form.noiCapPhep" placeholder="Sở Kế hoạch và Đầu tư TP.HCM" />
            </div>

            <template v-if="!editingTenant">
              <div class="section-label" style="margin-top:4px">Tài khoản Admin Tenant</div>
              <div class="form-row">
                <div class="field">
                  <label>Họ tên <span class="req">*</span></label>
                  <input v-model="form.admin.hoTen" placeholder="Nguyễn Văn A" />
                </div>
                <div class="field">
                  <label>Email admin <span class="req">*</span></label>
                  <input v-model="form.admin.email" type="email" placeholder="admin@cho.vn" />
                </div>
              </div>
              <div class="form-row">
                <div class="field">
                  <label>Số điện thoại admin <span class="req">*</span></label>
                  <input v-model="form.admin.soDienThoai" placeholder="0901234567" />
                </div>
                <div class="field">
                  <label>Mật khẩu <span class="req">*</span></label>
                  <input v-model="form.admin.password" type="password" placeholder="••••••••" />
                </div>
              </div>

              <div class="section-header">
                <div class="section-label" style="margin:0">Danh sách Chợ <span class="section-optional">(tuỳ chọn)</span></div>
                <button class="btn-add-market" @click="addMarket">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                  Thêm chợ
                </button>
              </div>

              <div v-if="form.markets.length === 0" class="market-empty">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#b0c4b0" stroke-width="1.5"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                <span>Chưa có chợ nào — nhấn "Thêm chợ" để thêm</span>
              </div>

              <div
                v-for="(m, idx) in form.markets"
                :key="idx"
                class="market-card"
              >
                <div class="market-card-head">
                  <span class="market-card-index">Chợ {{ idx + 1 }}</span>
                  <button class="market-remove-btn" @click="removeMarket(idx)" title="Xóa chợ này">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  </button>
                </div>
                <div class="form-row">
                  <div class="field">
                    <label>Tên chợ <span class="req">*</span></label>
                    <input v-model="m.tenCho" placeholder="Chợ Bến Thành" />
                  </div>
                  <div class="field">
                    <label>Địa chỉ chợ</label>
                    <input v-model="m.diaChi" placeholder="Đường Lê Lợi, Q1" />
                  </div>
                </div>
                <div class="field" style="max-width:200px">
                  <label>Diện tích (m²)</label>
                  <input v-model="m.dienTich" type="number" min="1" placeholder="500" />
                </div>
              </div>

              <div v-if="marketResult" class="market-result">
                <div v-if="marketResult.created.length" class="market-result-ok">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
                  Đã tạo {{ marketResult.created.length }} chợ:
                  <span v-for="c in marketResult.created" :key="c.market_id" class="market-chip">{{ c.tenCho }}</span>
                </div>
                <div v-if="marketResult.errors.length" class="market-result-err">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                  Lỗi {{ marketResult.errors.length }} chợ:
                  <span v-for="e in marketResult.errors" :key="e.tenCho" class="market-chip market-chip--err">{{ e.tenCho }}: {{ e.message }}</span>
                </div>
              </div>
            </template>

            <div class="error-banner" v-if="formError">{{ formError }}</div>
          </div>

          <div class="modal-footer">
            <button class="btn-ghost" @click="closeModal">Hủy</button>
            <button class="btn-primary" @click="submitTenant" :disabled="saving">
              <span v-if="saving" class="spin"></span>
              {{ saving ? 'Đang lưu...' : (editingTenant ? 'Cập nhật' : 'Tạo Tenant') }}
            </button>
          </div>
        </div>
      </div>

      <div v-if="assignPlanModal" class="modal-overlay" @click.self="assignPlanModal = false">
        <div class="modal modal--sm">
          <div class="modal-header">
            <h3>Gán gói cước — {{ assignTarget?.tenBanQuanLy }}</h3>
            <button class="modal-close" @click="assignPlanModal = false">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
          <div class="modal-body">
            <div class="field">
              <label>Chọn gói cước</label>
              <select v-model="assignForm.plan_id">
                <option value="">-- Chọn plan --</option>
                <option v-for="p in availablePlans" :key="p.plan_id" :value="p.plan_id">
                  {{ p.tenGoi }} — {{ fmtPrice(p.giaTien) }}/tháng
                </option>
              </select>
            </div>
            <div class="plan-preview" v-if="selectedPlan">
              <div class="plan-preview-name">{{ selectedPlan.tenGoi }}</div>
              <div class="plan-preview-price">{{ fmtPrice(selectedPlan.giaTien) }} / tháng</div>
              <div class="plan-preview-limits">
                <span>Kiosk: {{ selectedPlan.gioiHanSoKiosk }}</span>
                <span>User: {{ selectedPlan.gioiHanUser }}</span>
                <span>Chợ: {{ selectedPlan.gioiHanSoCho }}</span>
              </div>
            </div>
            <div class="error-banner" v-if="formError">{{ formError }}</div>
          </div>
          <div class="modal-footer">
            <button class="btn-ghost" @click="assignPlanModal = false">Hủy</button>
            <button class="btn-primary" @click="submitAssignPlan" :disabled="saving || !assignForm.plan_id">
              <span v-if="saving" class="spin"></span>
              Xác nhận gán
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

interface MarketForm {
  tenCho: string
  diaChi: string
  dienTich: string | number
}

const loading = ref(true)
const saving = ref(false)
const showModal = ref(false)
const assignPlanModal = ref(false)
const editingTenant = ref<any>(null)
const assignTarget = ref<any>(null)
const formError = ref('')
const fetchError = ref('')
const tenants = ref<any[]>([])
const availablePlans = ref<any[]>([])
const pagination = ref({ total: 0, totalPages: 1, page: 1, limit: 10 })
const marketResult = ref<{ created: any[]; errors: any[] } | null>(null)

const filters = reactive({
  keyword: '',
  trangThai: '',
  created_from: '',
  created_to: '',
  page: 1,
  limit: 10,
  sortBy: 'created_at',
  sortOrder: 'DESC',
})

const form = reactive({
  tenBanQuanLy: '',
  email: '',
  soDienThoai: '',
  diachi: '',
  maSoThue: '',
  tenCongTy: '',
  nguoiDaiDien: '',
  chucVu: '',
  giayPhepKinhDoanh: '',
  ngayCapPhep: '',
  noiCapPhep: '',
  admin: { hoTen: '', email: '', soDienThoai: '', password: '' },
  markets: [] as MarketForm[],
})

const assignForm = reactive({ plan_id: '' as string | number })

const selectedPlan = computed(() =>
  availablePlans.value.find(p => p.plan_id === assignForm.plan_id)
)

function addMarket() {
  form.markets.push({ tenCho: '', diaChi: '', dienTich: '' })
}

function removeMarket(idx: number) {
  form.markets.splice(idx, 1)
}

let debounceTimer: ReturnType<typeof setTimeout>
function debouncedFetch() {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => { filters.page = 1; fetchTenants() }, 400)
}

function resetFilters() {
  filters.keyword = ''
  filters.trangThai = ''
  filters.created_from = ''
  filters.created_to = ''
  filters.page = 1
  fetchTenants()
}

onMounted(async () => {
  await fetchTenants()
  try {
    const res = await api.get('/plan')
    availablePlans.value = res.data || []
  } catch {}
})

async function fetchTenants() {
  loading.value = true
  fetchError.value = ''
  try {
    const params: Record<string, string> = {
      page: String(filters.page),
      limit: String(filters.limit),
      sortBy: filters.sortBy,
      sortOrder: filters.sortOrder,
    }
    if (filters.keyword) params.keyword = filters.keyword
    if (filters.trangThai) params.trangThai = filters.trangThai
    if (filters.created_from) params.created_from = filters.created_from
    if (filters.created_to) params.created_to = filters.created_to

    const qs = new URLSearchParams(params).toString()
    const res = await api.get(`/tenant/list?${qs}`)
    tenants.value = res.data.data ?? []
    pagination.value = res.data.pagination ?? { total: 0, totalPages: 1, page: 1, limit: 10 }
  } catch (e: any) {
    fetchError.value = e.response?.data?.message || `Lỗi tải dữ liệu (${e.response?.status ?? 'network'})`
    tenants.value = []
  } finally {
    loading.value = false
  }
}

function changePage(p: number) { filters.page = p; fetchTenants() }

function openCreate() {
  editingTenant.value = null
  marketResult.value = null
  Object.assign(form, {
    tenBanQuanLy: '', email: '', soDienThoai: '', diachi: '',
    maSoThue: '', tenCongTy: '', nguoiDaiDien: '', chucVu: '',
    giayPhepKinhDoanh: '', ngayCapPhep: '', noiCapPhep: '',
    admin: { hoTen: '', email: '', soDienThoai: '', password: '' },
    markets: [],
  })
  formError.value = ''
  showModal.value = true
}

function openEdit(t: any) {
  editingTenant.value = t
  marketResult.value = null
  Object.assign(form, {
    tenBanQuanLy: t.tenBanQuanLy ?? '',
    email: t.email ?? '',
    soDienThoai: t.soDienThoai ?? '',
    diachi: t.diaChi ?? '',
    maSoThue: t.maSoThue ?? '',
    tenCongTy: t.tenCongTy ?? '',
    nguoiDaiDien: t.nguoiDaiDien ?? '',
    chucVu: t.chucVu ?? '',
    giayPhepKinhDoanh: t.giayPhepKinhDoanh ?? '',
    ngayCapPhep: t.ngayCapPhep ?? '',
    noiCapPhep: t.noiCapPhep ?? '',
  })
  formError.value = ''
  showModal.value = true
}

function closeModal() {
  showModal.value = false
  marketResult.value = null
}

function openAssignPlan(t: any) {
  assignTarget.value = t
  assignForm.plan_id = ''
  formError.value = ''
  assignPlanModal.value = true
}

async function toggleStatus(t: any) {
  const newStatus = t.trangThai === 'active' ? 'suspended' : 'active'
  try {
    await api.patch(`/tenant/${t.tenant_id}/status`, { trangThai: newStatus })
    t.trangThai = newStatus
  } catch (e: any) {
    alert(e.response?.data?.message || 'Lỗi cập nhật trạng thái')
  }
}

async function submitTenant() {
  if (!form.tenBanQuanLy || !form.email || !form.soDienThoai || !form.diachi) {
    formError.value = 'Vui lòng điền đầy đủ thông tin Tenant'
    return
  }
  if (!form.maSoThue) {
    formError.value = 'Mã số thuế là bắt buộc'
    return
  }
  if (!editingTenant.value && (!form.admin.hoTen || !form.admin.email || !form.admin.password || !form.admin.soDienThoai)) {
    formError.value = 'Vui lòng điền đầy đủ thông tin Admin'
    return
  }

  const marketsToCreate = form.markets.filter(m => m.tenCho.trim().length > 0)
  for (const m of marketsToCreate) {
    if (m.tenCho.trim().length < 2) {
      formError.value = 'Tên chợ phải có ít nhất 2 ký tự'
      return
    }
    if (m.dienTich && Number(m.dienTich) <= 0) {
      formError.value = 'Diện tích chợ phải lớn hơn 0'
      return
    }
  }

  saving.value = true
  formError.value = ''
  marketResult.value = null

  try {
    if (editingTenant.value) {
      await api.put(`/tenant/${editingTenant.value.tenant_id}`, {
        tenBanQuanLy: form.tenBanQuanLy,
        email: form.email,
        soDienThoai: form.soDienThoai,
        diachi: form.diachi,
        maSoThue: form.maSoThue,
        tenCongTy: form.tenCongTy,
        nguoiDaiDien: form.nguoiDaiDien,
        chucVu: form.chucVu,
        giayPhepKinhDoanh: form.giayPhepKinhDoanh,
        ngayCapPhep: form.ngayCapPhep,
        noiCapPhep: form.noiCapPhep,
      })
      closeModal()
      fetchTenants()
    } else {
      const createRes = await api.post('/tenant', {
        tenBanQuanLy: form.tenBanQuanLy,
        email: form.email,
        soDienThoai: form.soDienThoai,
        diachi: form.diachi,
        maSoThue: form.maSoThue,
        tenCongTy: form.tenCongTy,
        nguoiDaiDien: form.nguoiDaiDien,
        chucVu: form.chucVu,
        giayPhepKinhDoanh: form.giayPhepKinhDoanh,
        ngayCapPhep: form.ngayCapPhep,
        noiCapPhep: form.noiCapPhep,
        admin: {
          hoTen: form.admin.hoTen,
          email: form.admin.email,
          soDienThoai: form.admin.soDienThoai,
          password: form.admin.password,
        },
        markets: marketsToCreate.map(m => ({
          tenCho: m.tenCho.trim(),
          diaChi: m.diaChi.trim() || null,
          dienTich: m.dienTich ? Number(m.dienTich) : null,
        })),
      })

      const created = createRes.data?.marketsCreated ?? []
      const errors  = createRes.data?.marketsErrors  ?? []

      if (marketsToCreate.length > 0) {
        marketResult.value = { created, errors }
        if (errors.length > 0) {
          fetchTenants()
          return
        }
      }

      closeModal()
      fetchTenants()
    }
  } catch (e: any) {
    const errorMessage = e.response?.data?.message || 'Lỗi khi lưu'
    
    if (errorMessage.includes('email đã tồn tại') || 
        errorMessage.includes('số điện thoại đã tồn tại') ||
        errorMessage.includes('Mã số thuế đã tồn tại') ||
        errorMessage.includes('Email admin đã tồn tại')) {
      formError.value = errorMessage
    } else {
      formError.value = errorMessage
    }
  } finally {
    saving.value = false
  }
}

async function submitAssignPlan() {
  if (!assignForm.plan_id || !assignTarget.value) return
  saving.value = true
  formError.value = ''
  try {
    await api.post('/plan_subscription', {
      tenant_id: assignTarget.value.tenant_id,
      plan_id: assignForm.plan_id,
    })
    assignPlanModal.value = false
    fetchTenants()
  } catch (e: any) {
    formError.value = e.response?.data?.message || 'Lỗi khi gán plan'
  } finally {
    saving.value = false
  }
}

function fmtDate(d: string): string {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function fmtPrice(p: number): string {
  if (!p && p !== 0) return 'Miễn phí'
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(p)
}

function initials(name: string): string {
  if (!name) return '?'
  return name.trim().split(/\s+/).map(w => w[0]).slice(-2).join('').toUpperCase()
}

const avatarColors = ['#eef7ee', '#eff6ff', '#fffbeb', '#f5f3ff', '#fff1f2']
function avatarBg(name: string): string {
  return avatarColors[(name?.charCodeAt(0) ?? 0) % avatarColors.length]
}
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@300;400;500;600&display=swap');
*, *::before, *::after { box-sizing: border-box; }

.tenants-page { display: flex; flex-direction: column; gap: 18px; font-family: 'Be Vietnam Pro', sans-serif; }

.page-header { display: flex; justify-content: space-between; align-items: flex-start; }
.page-title { font-size: 22px; font-weight: 600; color: #1a2e1a; margin: 0 0 4px; letter-spacing: -.3px; }
.page-sub { font-size: 13px; color: #6b836b; margin: 0; }

.error-banner { display: flex; align-items: center; gap: 8px; background: #fef2f2; border: 1px solid #fecaca; border-radius: 10px; padding: 10px 14px; color: #b91c1c; font-size: 13px; }

.filter-bar { display: flex; gap: 10px; flex-wrap: wrap; align-items: center; }
.search-wrap { flex: 1; min-width: 200px; max-width: 300px; position: relative; display: flex; align-items: center; }
.search-wrap svg { position: absolute; left: 11px; color: #94a894; pointer-events: none; }
.search-wrap input { width: 100%; height: 38px; padding: 0 12px 0 33px; border: 1.5px solid #d4e4d4; border-radius: 10px; font-size: 13px; font-family: 'Be Vietnam Pro', sans-serif; color: #1a2e1a; background: white; outline: none; }
.search-wrap input:focus { border-color: #3d8c3d; }
select, .date-input { height: 38px; padding: 0 10px; border: 1.5px solid #d4e4d4; border-radius: 10px; font-size: 13px; font-family: 'Be Vietnam Pro', sans-serif; color: #1a2e1a; background: white; outline: none; }

.table-panel { background: white; border: 1px solid #e2ede2; border-radius: 14px; overflow: hidden; }
.table-wrap { overflow-x: auto; }
.data-table { width: 100%; border-collapse: collapse; }
.data-table th { padding: 11px 14px; font-size: 11px; font-weight: 600; color: #94a894; text-transform: uppercase; letter-spacing: .06em; text-align: left; background: #fafcfa; border-bottom: 1px solid #f0f5f0; white-space: nowrap; }
.data-table td { padding: 13px 14px; border-bottom: 1px solid #f7faf7; vertical-align: middle; }
.data-table tbody tr:hover td { background: #fafcfa; }
.data-table tbody tr:last-child td { border-bottom: none; }

.cell-with-avatar { display: flex; align-items: center; gap: 9px; }
.avatar-sq { width: 34px; height: 34px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 11.5px; font-weight: 600; color: #2d4a2d; flex-shrink: 0; }
.cell-main { font-size: 13.5px; font-weight: 500; color: #1a2e1a; }
.cell-sub { font-size: 12.5px; color: #6b836b; }
.cell-date { font-size: 12.5px; color: #6b836b; white-space: nowrap; }

.badge { display: inline-flex; align-items: center; padding: 3px 9px; border-radius: 20px; font-size: 11.5px; font-weight: 500; }
.badge--green { background: #eef7ee; color: #2d6e2d; }
.badge--red { background: #fef2f2; color: #dc2626; }

.action-btns { display: flex; gap: 5px; }
.icon-btn { width: 30px; height: 30px; background: none; border: 1px solid #e2ede2; border-radius: 7px; display: flex; align-items: center; justify-content: center; cursor: pointer; color: #4a654a; transition: all .15s; }
.icon-btn:hover { background: #f0f7f0; }
.icon-btn--danger { color: #dc2626; border-color: #fecaca; }
.icon-btn--danger:hover { background: #fef2f2; }
.icon-btn--success { color: #3d8c3d; }
.icon-btn--success:hover { background: #eef7ee; }

.empty-row { text-align: center; padding: 48px 16px !important; color: #94a894; }
.empty-row p { margin: 8px 0 0; font-size: 13px; }

.loading-bar { height: 3px; background: linear-gradient(90deg, #eef7ee, #3d8c3d, #eef7ee); background-size: 200%; animation: shimmer 1.5s infinite; }
@keyframes shimmer { to { background-position: -200% center; } }

.table-foot { display: flex; justify-content: space-between; align-items: center; padding: 12px 16px; border-top: 1px solid #f0f5f0; }
.total-label { font-size: 12.5px; color: #94a894; }
.pagination { display: flex; align-items: center; gap: 10px; }
.pagination button { height: 32px; padding: 0 14px; background: white; border: 1px solid #e2ede2; border-radius: 8px; cursor: pointer; font-size: 12.5px; font-family: 'Be Vietnam Pro', sans-serif; color: #4a654a; transition: background .15s; }
.pagination button:hover:not(:disabled) { background: #f0f7f0; }
.pagination button:disabled { opacity: 0.4; cursor: not-allowed; }
.pagination span { font-size: 12.5px; color: #6b836b; }

.btn-primary { display: inline-flex; align-items: center; gap: 7px; height: 40px; padding: 0 18px; background: #3d8c3d; border: none; border-radius: 10px; color: white; font-size: 13.5px; font-weight: 500; font-family: 'Be Vietnam Pro', sans-serif; cursor: pointer; transition: background .15s; }
.btn-primary:hover:not(:disabled) { background: #2d6e2d; }
.btn-primary:disabled { opacity: 0.55; cursor: not-allowed; }

.btn-ghost { height: 40px; padding: 0 18px; background: none; border: 1px solid #e2ede2; border-radius: 10px; color: #4a654a; font-size: 13.5px; font-family: 'Be Vietnam Pro', sans-serif; cursor: pointer; }
.btn-ghost:hover { background: #f7faf7; }

.btn-outline { display: inline-flex; align-items: center; gap: 6px; height: 38px; padding: 0 14px; background: white; border: 1.5px solid #d4e4d4; border-radius: 10px; color: #4a654a; font-size: 13px; font-family: 'Be Vietnam Pro', sans-serif; cursor: pointer; }
.btn-outline:hover { background: #f0f7f0; }

/* Modal */
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 1rem; }
.modal { background: white; border-radius: 16px; width: 100%; max-width: 1000px; max-height: 90vh; overflow-y: auto; box-shadow: 0 20px 60px rgba(0,0,0,0.15); }
.modal--sm { max-width: 420px; }
.modal-header { display: flex; justify-content: space-between; align-items: center; padding: 18px 22px 14px; border-bottom: 1px solid #f0f5f0; }
.modal-header h3 { font-size: 15px; font-weight: 600; color: #1a2e1a; margin: 0; }
.modal-close { background: none; border: none; color: #94a894; cursor: pointer; display: flex; align-items: center; padding: 4px; border-radius: 6px; }
.modal-close:hover { background: #f0f5f0; }
.modal-body { padding: 18px 22px; display: flex; flex-direction: column; gap: 12px; }
.modal-footer { display: flex; justify-content: flex-end; gap: 10px; padding: 14px 22px; border-top: 1px solid #f0f5f0; }

.section-label { font-size: 11px; font-weight: 600; color: #94a894; text-transform: uppercase; letter-spacing: .07em; }
.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.field { display: flex; flex-direction: column; gap: 5px; }
.field label { font-size: 12.5px; font-weight: 500; color: #3a4f3a; }
.req { color: #dc2626; }
.field input, .field select { width: 100%; height: 40px; padding: 0 12px; border: 1.5px solid #d4e4d4; border-radius: 10px; font-size: 13.5px; font-family: 'Be Vietnam Pro', sans-serif; color: #1a2e1a; background: #fbfdfb; outline: none; transition: border .2s; }
.field input:focus, .field select:focus { border-color: #3d8c3d; background: white; }

/* Section header cho chợ */
.section-header { display: flex; align-items: center; justify-content: space-between; }
.section-optional { font-size: 10px; color: #b0c4b0; font-weight: 400; text-transform: none; letter-spacing: 0; margin-left: 4px; }

.btn-add-market { display: inline-flex; align-items: center; gap: 5px; height: 30px; padding: 0 12px; background: #eef7ee; border: 1px solid #c6e6c6; border-radius: 8px; color: #2d6e2d; font-size: 12.5px; font-weight: 500; font-family: 'Be Vietnam Pro', sans-serif; cursor: pointer; transition: background .15s; }
.btn-add-market:hover { background: #ddf0dd; }

/* Market empty state */
.market-empty { display: flex; align-items: center; gap: 8px; padding: 12px 14px; background: #fafcfa; border: 1px dashed #d4e4d4; border-radius: 10px; color: #94a894; font-size: 12.5px; }

/* Market card */
.market-card { background: #fafcfa; border: 1px solid #e2ede2; border-radius: 12px; padding: 14px; display: flex; flex-direction: column; gap: 10px; }
.market-card-head { display: flex; align-items: center; justify-content: space-between; }
.market-card-index { font-size: 12px; font-weight: 600; color: #3d8c3d; }
.market-remove-btn { width: 26px; height: 26px; background: none; border: 1px solid #fecaca; border-radius: 6px; display: flex; align-items: center; justify-content: center; cursor: pointer; color: #dc2626; transition: background .15s; }
.market-remove-btn:hover { background: #fef2f2; }

/* Market result */
.market-result { background: #f7faf7; border: 1px solid #e2ede2; border-radius: 10px; padding: 12px 14px; display: flex; flex-direction: column; gap: 8px; font-size: 12.5px; }
.market-result-ok { display: flex; align-items: flex-start; gap: 6px; color: #2d6e2d; flex-wrap: wrap; }
.market-result-ok svg { flex-shrink: 0; margin-top: 1px; }
.market-result-err { display: flex; align-items: flex-start; gap: 6px; color: #b91c1c; flex-wrap: wrap; }
.market-result-err svg { flex-shrink: 0; margin-top: 1px; }
.market-chip { display: inline-block; background: #eef7ee; border: 1px solid #c6e6c6; border-radius: 6px; padding: 1px 8px; margin: 2px 0; color: #2d4a2d; font-size: 12px; }
.market-chip--err { background: #fef2f2; border-color: #fecaca; color: #b91c1c; }

.plan-preview { background: #f7faf7; border: 1px solid #e2ede2; border-radius: 10px; padding: 12px 14px; }
.plan-preview-name { font-size: 14px; font-weight: 600; color: #1a2e1a; margin-bottom: 3px; }
.plan-preview-price { font-size: 18px; font-weight: 700; color: #3d8c3d; margin-bottom: 6px; }
.plan-preview-limits { display: flex; gap: 12px; font-size: 12px; color: #6b836b; }

.spin { width: 14px; height: 14px; border: 2px solid rgba(255,255,255,.35); border-top-color: white; border-radius: 50%; animation: spin .65s linear infinite; display: inline-block; }
@keyframes spin { to { transform: rotate(360deg); } }
</style>