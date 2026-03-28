<template>
  <div class="page">
    <div class="page-header">
      <div>
        <h1 class="page-title">Quản lý Thu ngân</h1>
      </div>
      <button class="btn-primary" @click="openCreate" :disabled="quotaFull">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        Thêm Thu ngân
      </button>
    </div>

    <div class="filter-bar">
      <div class="search-wrap">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <input v-model="filters.keyword" placeholder="Tìm tên, email, SĐT..." @input="debouncedFetch" />
      </div>
      <select v-model="filters.trangThai" @change="fetchData">
        <option value="">Tất cả trạng thái</option>
        <option value="active">Hoạt động</option>
        <option value="suspended">Đã khóa</option>
      </select>
      <button class="btn-outline" @click="resetFilters">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-4.95"/></svg>
        Reset
      </button>
    </div>

    <div class="quota-bar" v-if="quota.max">
      <div class="quota-info">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
        <span>Tài khoản đang dùng: <strong>{{ quota.used }}</strong> / <strong>{{ quota.max }}</strong> <span class="quota-note">(thu ngân + tiểu thương)</span></span>
      </div>
      <div class="quota-track">
        <div class="quota-fill" :style="{ width: quotaPct + '%' }" :class="{ 'quota-fill--warn': quotaPct >= 80, 'quota-fill--full': quotaPct >= 100 }"></div>
      </div>
      <div class="quota-full-msg" v-if="quotaFull">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        Đã đạt giới hạn tài khoản của gói cước. Vui lòng nâng cấp gói để thêm mới.
      </div>
    </div>

    <div class="table-panel">
      <div class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>Họ tên</th>
              <th>Email</th>
              <th>Số điện thoại</th>
              <th>Trạng thái</th>
              <th>Ngày tạo</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading"><td colspan="6"><div class="loading-bar"></div></td></tr>
            <template v-else>
              <tr v-for="u in items" :key="u.user_id">
                <td>
                  <div class="cell-with-avatar">
                    <div class="user-avatar">{{ initials(u.hoTen) }}</div>
                    <div>
                      <div class="cell-main">{{ u.hoTen }}</div>
                      <div class="role-tag">Thu ngân</div>
                    </div>
                  </div>
                </td>
                <td class="cell-sub">{{ u.email }}</td>
                <td class="cell-sub">{{ u.soDienThoai || '—' }}</td>
                <td>
                  <span class="badge" :class="u.trangThai === 'active' ? 'badge--green' : 'badge--red'">
                    {{ u.trangThai === 'active' ? 'Hoạt động' : 'Đã khóa' }}
                  </span>
                </td>
                <td class="cell-date">{{ fmtDate(u.created_at) }}</td>
                <td>
                  <div class="action-btns">
                    <button class="icon-btn" title="Chỉnh sửa" @click="openEdit(u)">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    </button>
                    <button class="icon-btn" title="Đổi mật khẩu" @click="openResetPwd(u)">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                    </button>
                    <button
                      class="icon-btn"
                      :class="u.trangThai === 'active' ? 'icon-btn--danger' : 'icon-btn--success'"
                      :title="u.trangThai === 'active' ? 'Khóa tài khoản' : 'Mở khóa'"
                      @click="toggleStatus(u)"
                    >
                      <svg v-if="u.trangThai === 'active'" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                      <svg v-else width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/></svg>
                    </button>
                  </div>
                </td>
              </tr>
              <tr v-if="!items.length">
                <td colspan="6" class="empty-row">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#b0c4b0" stroke-width="1.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
                  <p>Chưa có thu ngân nào</p>
                </td>
              </tr>
            </template>
          </tbody>
        </table>
      </div>
      <div class="table-foot">
        <span class="total-label">{{ meta.total }} thu ngân</span>
        <div class="pagination" v-if="meta.totalPages > 1">
          <button :disabled="pg.page <= 1" @click="changePage(pg.page - 1)">← Trước</button>
          <span>{{ pg.page }} / {{ meta.totalPages }}</span>
          <button :disabled="pg.page >= meta.totalPages" @click="changePage(pg.page + 1)">Tiếp →</button>
        </div>
      </div>
    </div>

    <Teleport to="body">
      <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
        <div class="modal">
          <div class="modal-header">
            <h3>{{ editing ? 'Cập nhật Thu ngân' : 'Thêm Thu ngân mới' }}</h3>
            <button class="modal-close" @click="closeModal">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
          <div class="modal-body">
            <div class="form-row">
              <div class="field">
                <label>Họ tên <span class="req">*</span></label>
                <input v-model="form.hoTen" placeholder="Nguyễn Văn A" />
              </div>
              <div class="field">
                <label>Email <span class="req">*</span></label>
                <input v-model="form.email" type="email" placeholder="thungan@example.com" :disabled="!!editing" />
              </div>
            </div>
            <div class="form-row">
              <div class="field">
                <label>Số điện thoại <span class="req">*</span></label>
                <input v-model="form.soDienThoai" placeholder="0901234567" />
              </div>
              <div class="field" v-if="!editing">
                <label>Mật khẩu <span class="req">*</span></label>
                <input v-model="form.password" type="password" placeholder="••••••••" />
              </div>
            </div>
            <div class="info-note" v-if="!editing">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="flex-shrink:0;margin-top:1px"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              <span>Tài khoản này sẽ có quyền <strong>Thu ngân</strong> — có thể mở/chốt ca và thu phí từ tiểu thương.</span>
            </div>
            <div class="error-banner" v-if="formError">{{ formError }}</div>
          </div>
          <div class="modal-footer">
            <button class="btn-ghost" @click="closeModal">Hủy</button>
            <button class="btn-primary" @click="submit" :disabled="saving">
              <span v-if="saving" class="spin"></span>
              {{ saving ? 'Đang lưu...' : (editing ? 'Cập nhật' : 'Tạo tài khoản') }}
            </button>
          </div>
        </div>
      </div>

      <div v-if="pwdModal" class="modal-overlay" @click.self="pwdModal = false">
        <div class="modal modal--sm">
          <div class="modal-header">
            <h3>Đặt lại mật khẩu</h3>
            <button class="modal-close" @click="pwdModal = false">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
          <div class="modal-body">
            <div class="field">
              <label>Tài khoản</label>
              <input :value="pwdTarget?.hoTen" disabled />
            </div>
            <div class="field">
              <label>Mật khẩu mới <span class="req">*</span></label>
              <input v-model="newPwd" type="password" placeholder="••••••••" />
            </div>
            <div class="error-banner" v-if="pwdError">{{ pwdError }}</div>
            <div class="success-banner" v-if="pwdSuccess">Đổi mật khẩu thành công!</div>
          </div>
          <div class="modal-footer">
            <button class="btn-ghost" @click="pwdModal = false">Đóng</button>
            <button class="btn-primary" @click="submitPwd" :disabled="saving">
              <span v-if="saving" class="spin"></span>
              Xác nhận
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

const loading        = ref(true)
const saving         = ref(false)
const showModal      = ref(false)
const pwdModal       = ref(false)
const editing        = ref<any>(null)
const pwdTarget      = ref<any>(null)
const formError      = ref('')
const pwdError       = ref('')
const pwdSuccess     = ref(false)
const newPwd         = ref('')
const items          = ref<any[]>([])
const collectorRoleId = ref<number | null>(null)
const meta           = ref({ total: 0, totalPages: 1 })
const quota          = ref({ used: 0, max: 0 })

const filters = reactive({ keyword: '', trangThai: '' })
const pg      = reactive({ page: 1, limit: 10 })
const form    = reactive({ hoTen: '', email: '', soDienThoai: '', password: '' })

const quotaPct  = computed(() => quota.value.max ? Math.min(100, Math.round(quota.value.used / quota.value.max * 100)) : 0)
const quotaFull = computed(() => quota.value.max > 0 && quota.value.used >= quota.value.max)

let debounceTimer: any
function debouncedFetch() {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => { pg.page = 1; fetchData() }, 400)
}

onMounted(async () => {
  try {
    const r = await api.get('/role')
    const tn = (r.data || []).find((x: any) => x.tenVaiTro === 'ThuNgan' || x.tenVaiTro === 'collector')
    if (tn) collectorRoleId.value = tn.role_id
  } catch {}

  try {
    const s = await api.get('/plan_subscription')
    if (s.data?.gioiHanUser) quota.value.max = s.data.gioiHanUser
  } catch {}

  fetchData()
})

async function fetchData() {
  loading.value = true
  try {
    const params: any = { page: pg.page, limit: pg.limit }
    if (filters.keyword)   params.keyword   = filters.keyword
    if (filters.trangThai) params.trangThai = filters.trangThai
    if (collectorRoleId.value) params.role_id = collectorRoleId.value

    const res = await api.get('/users', { params })
    items.value = res.data.data || []
    meta.value  = res.data.pagination || { total: 0, totalPages: 1 }

    // Quota: tổng collector + merchant
    try {
      const countRes = await api.get('/users/account-count')
      quota.value.used = countRes.data.total || 0
    } catch {
      quota.value.used = meta.value.total
    }
  } catch { items.value = [] }
  finally { loading.value = false }
}

function resetFilters() { filters.keyword = ''; filters.trangThai = ''; pg.page = 1; fetchData() }
function changePage(p: number) { pg.page = p; fetchData() }

function openCreate() {
  if (quotaFull.value) return
  editing.value = null
  Object.assign(form, { hoTen: '', email: '', soDienThoai: '', password: '' })
  formError.value = ''
  showModal.value = true
}

function openEdit(u: any) {
  editing.value = u
  Object.assign(form, { hoTen: u.hoTen, email: u.email, soDienThoai: u.soDienThoai || '', password: '' })
  formError.value = ''
  showModal.value = true
}

function openResetPwd(u: any) {
  pwdTarget.value = u; newPwd.value = ''; pwdError.value = ''; pwdSuccess.value = false; pwdModal.value = true
}

function closeModal() { showModal.value = false }

async function toggleStatus(u: any) {
  const s = u.trangThai === 'active' ? 'suspended' : 'active'
  try {
    await api.patch(`/users/${u.user_id}/status`, { trangThai: s })
    u.trangThai = s
  } catch (e: any) { alert(e.response?.data?.message || 'Lỗi') }
}

async function submit() {
  if (!form.hoTen.trim() || !form.email.trim() || !form.soDienThoai.trim()) {
    formError.value = 'Vui lòng điền đầy đủ thông tin'; return
  }
  if (!editing.value && !form.password) { formError.value = 'Vui lòng nhập mật khẩu'; return }

  saving.value = true; formError.value = ''
  try {
    if (editing.value) {
      await api.put(`/users/${editing.value.user_id}`, {
        hoTen: form.hoTen, soDienThoai: form.soDienThoai, email: form.email,
      })
    } else {
      if (!collectorRoleId.value) { formError.value = 'Không tìm thấy role Thu ngân'; return }
      await api.post('/users', {
        hoTen: form.hoTen, email: form.email,
        soDienThoai: form.soDienThoai, password: form.password,
        role_id: collectorRoleId.value,
      })
    }
    closeModal(); fetchData()
  } catch (e: any) { formError.value = e.response?.data?.message || 'Lỗi khi lưu' }
  finally { saving.value = false }
}

async function submitPwd() {
  if (!newPwd.value || newPwd.value.length < 6) { pwdError.value = 'Mật khẩu phải ít nhất 6 ký tự'; return }
  saving.value = true; pwdError.value = ''; pwdSuccess.value = false
  try {
    await api.put(`/users/${pwdTarget.value.user_id}/password`, { newPassword: newPwd.value })
    pwdSuccess.value = true; newPwd.value = ''
    setTimeout(() => { pwdModal.value = false }, 1500)
  } catch (e: any) { pwdError.value = e.response?.data?.message || 'Lỗi đổi mật khẩu' }
  finally { saving.value = false }
}

function fmtDate(d: string) { return d ? new Date(d).toLocaleDateString('vi-VN') : '—' }
function initials(n: string) { return (n || '?').split(' ').map((w: string) => w[0]).slice(-2).join('').toUpperCase() }
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@300;400;500;600&display=swap');
*, *::before, *::after { box-sizing: border-box; }
.page { display: flex; flex-direction: column; gap: 18px; font-family: 'Be Vietnam Pro', sans-serif; }
.page-header { display: flex; justify-content: space-between; align-items: flex-start; }
.page-title { font-size: 22px; font-weight: 600; color: #1a2e1a; margin: 0 0 4px; }
.page-sub { font-size: 13px; color: #6b836b; margin: 0; }

.filter-bar { display: flex; gap: 10px; flex-wrap: wrap; align-items: center; }
.search-wrap { flex: 1; min-width: 200px; max-width: 300px; position: relative; display: flex; align-items: center; }
.search-wrap svg { position: absolute; left: 11px; color: #94a894; pointer-events: none; }
.search-wrap input { width: 100%; height: 38px; padding: 0 12px 0 33px; border: 1.5px solid #d4e4d4; border-radius: 10px; font-size: 13px; font-family: 'Be Vietnam Pro', sans-serif; color: #1a2e1a; background: white; outline: none; }
.search-wrap input:focus { border-color: #3d8c3d; }
select { height: 38px; padding: 0 10px; border: 1.5px solid #d4e4d4; border-radius: 10px; font-size: 13px; font-family: 'Be Vietnam Pro', sans-serif; color: #1a2e1a; background: white; outline: none; }

.quota-bar { background: white; border: 1px solid #e2ede2; border-radius: 12px; padding: 12px 16px; display: flex; flex-direction: column; gap: 8px; }
.quota-info { display: flex; align-items: center; gap: 8px; font-size: 13px; color: #4a654a; }
.quota-info strong { color: #1a2e1a; }
.quota-note { font-size: 11.5px; color: #94a894; margin-left: 2px; }
.quota-track { height: 6px; background: #f0f5f0; border-radius: 3px; overflow: hidden; }
.quota-fill { height: 100%; background: #3d8c3d; border-radius: 3px; transition: width 0.3s; }
.quota-fill--warn { background: #f97316; }
.quota-fill--full { background: #dc2626; }
.quota-full-msg { display: flex; align-items: center; gap: 7px; font-size: 12.5px; color: #dc2626; background: #fef2f2; border-radius: 8px; padding: 8px 12px; }

.table-panel { background: white; border: 1px solid #e2ede2; border-radius: 14px; overflow: hidden; }
.table-wrap { overflow-x: auto; }
.data-table { width: 100%; border-collapse: collapse; }
.data-table th { padding: 11px 14px; font-size: 11px; font-weight: 600; color: #94a894; text-transform: uppercase; letter-spacing: .06em; text-align: left; background: #fafcfa; border-bottom: 1px solid #f0f5f0; white-space: nowrap; }
.data-table td { padding: 13px 14px; border-bottom: 1px solid #f7faf7; vertical-align: middle; }
.data-table tbody tr:hover td { background: #fafcfa; }
.data-table tbody tr:last-child td { border-bottom: none; }
.cell-with-avatar { display: flex; align-items: center; gap: 10px; }
.user-avatar { width: 34px; height: 34px; background: #0f766e; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 700; color: white; flex-shrink: 0; }
.cell-main { font-size: 13.5px; font-weight: 500; color: #1a2e1a; }
.role-tag { font-size: 11px; color: #0f766e; background: #e0fdf4; padding: 1px 6px; border-radius: 4px; display: inline-block; margin-top: 2px; }
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
.loading-bar { height: 3px; background: linear-gradient(90deg,#eef7ee,#3d8c3d,#eef7ee); background-size: 200%; animation: shimmer 1.5s infinite; }
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
.btn-ghost { height: 40px; padding: 0 18px; background: none; border: 1px solid #e2ede2; border-radius: 10px; color: #4a654a; font-size: 13.5px; font-family: 'Be Vietnam Pro', sans-serif; cursor: pointer; }
.btn-ghost:hover { background: #f7faf7; }
.btn-outline { display: inline-flex; align-items: center; gap: 6px; height: 38px; padding: 0 14px; background: white; border: 1.5px solid #d4e4d4; border-radius: 10px; color: #4a654a; font-size: 13px; font-family: 'Be Vietnam Pro', sans-serif; cursor: pointer; }
.btn-outline:hover { background: #f0f7f0; }

.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 1rem; }
.modal { background: white; border-radius: 16px; width: 100%; max-width: 480px; max-height: 90vh; overflow-y: auto; box-shadow: 0 20px 60px rgba(0,0,0,0.15); }
.modal--sm { max-width: 380px; }
.modal-header { display: flex; justify-content: space-between; align-items: center; padding: 18px 22px 14px; border-bottom: 1px solid #f0f5f0; }
.modal-header h3 { font-size: 15px; font-weight: 600; color: #1a2e1a; margin: 0; }
.modal-close { background: none; border: none; color: #94a894; cursor: pointer; display: flex; align-items: center; padding: 4px; border-radius: 6px; }
.modal-close:hover { background: #f0f5f0; }
.modal-body { padding: 18px 22px; display: flex; flex-direction: column; gap: 14px; }
.modal-footer { display: flex; justify-content: flex-end; gap: 10px; padding: 14px 22px; border-top: 1px solid #f0f5f0; }
.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.field { display: flex; flex-direction: column; gap: 5px; }
.field label { font-size: 12.5px; font-weight: 500; color: #3a4f3a; }
.req { color: #dc2626; }
.field input { width: 100%; height: 40px; padding: 0 12px; border: 1.5px solid #d4e4d4; border-radius: 10px; font-size: 13.5px; font-family: 'Be Vietnam Pro', sans-serif; color: #1a2e1a; background: #fbfdfb; outline: none; }
.field input:focus { border-color: #3d8c3d; background: white; }
.field input:disabled { background: #f5f8f5; color: #94a894; cursor: not-allowed; }

.info-note {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  border-radius: 8px;
  padding: 10px 14px;
  font-size: 13px;
  color: #1e40af;
  line-height: 1.55;
}
.info-note span { display: block; }
.info-note strong { font-weight: 600; }

.error-banner { background: #fef2f2; border: 1px solid #fecaca; border-radius: 9px; padding: 10px 14px; color: #b91c1c; font-size: 13px; }
.success-banner { background: #eef7ee; border: 1px solid #d4e4d4; border-radius: 9px; padding: 10px 14px; color: #2d6e2d; font-size: 13px; }
.spin { width: 14px; height: 14px; border: 2px solid rgba(255,255,255,.35); border-top-color: white; border-radius: 50%; animation: spin .65s linear infinite; display: inline-block; }
@keyframes spin { to { transform: rotate(360deg); } }
</style>