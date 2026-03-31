<template>
  <div class="page">
    <div class="page-header">
      <div>
        <h1 class="page-title">Tiểu thương</h1>
      </div>
      <button class="btn-primary" @click="openCreate">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        Thêm Tiểu thương
      </button>
    </div>

    <div class="filter-bar">
      <div class="search-wrap">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <input v-model="filters.q" placeholder="Tìm tên, CCCD, SĐT..." @input="debouncedFetch" />
      </div>
      <select v-model="filters.trangThai" @change="fetchData">
        <option value="">Tất cả trạng thái</option>
        <option value="active">Hoạt động</option>
        <option value="inactive">Đã khóa</option>
      </select>
      <select v-model="filters.has_active_assignment" @change="fetchData">
        <option value="">Tất cả</option>
        <option value="true">Đang thuê quầy</option>
        <option value="false">Chưa có quầy</option>
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
    </div>

    <div class="table-panel">
      <div class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>Tiểu thương</th>
              <th>CCCD</th>
              <th>Số điện thoại</th>
              <th>Quầy đang thuê</th>
              <th>Tham gia</th>
              <th>Trạng thái</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading"><td colspan="7"><div class="loading-bar"></div></td></tr>
            <template v-else>
              <tr v-for="m in items" :key="m.merchant_id" class="row-clickable" @click="openDetail(m)">
                <td>
                  <div class="cell-with-avatar">
                    <div class="m-avatar">{{ initials(m.hoTen) }}</div>
                    <div>
                      <div class="cell-main">{{ m.hoTen }}</div>
                      <div class="cell-sub">{{ m.maSoThue || '—' }}</div>
                    </div>
                  </div>
                </td>
                <td class="cell-mono">{{ m.CCCD }}</td>
                <td class="cell-sub">{{ m.soDienThoai || '—' }}</td>
                <td @click.stop>
                  <span v-if="m.has_kiosk" class="kiosk-badge">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></svg>
                    Đang thuê
                  </span>
                  <span v-else class="cell-sub">Chưa có quầy</span>
                </td>
                <td class="cell-date">{{ fmtDate(m.ngayThamGiaKinhDoanh) }}</td>
                <td>
                  <span class="badge" :class="m.trangThai === 'active' ? 'badge--green' : 'badge--red'">
                    {{ m.trangThai === 'active' ? 'Hoạt động' : 'Đã khóa' }}
                  </span>
                </td>
                <td @click.stop>
                  <div class="action-btns">
                    <button class="icon-btn" title="Xem chi tiết" @click="openDetail(m)">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    </button>
                    <button class="icon-btn" title="Chỉnh sửa" @click="openEdit(m)">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    </button>
                    <button
                      class="icon-btn"
                      :class="m.trangThai === 'active' ? 'icon-btn--danger' : 'icon-btn--success'"
                      :title="m.trangThai === 'active' ? 'Khóa' : 'Mở khóa'"
                      @click="toggleStatus(m)"
                    >
                      <svg v-if="m.trangThai === 'active'" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                      <svg v-else width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/></svg>
                    </button>
                  </div>
                </td>
              </tr>
              <tr v-if="!items.length">
                <td colspan="7" class="empty-row">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#b0c4b0" stroke-width="1.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
                  <p>Chưa có tiểu thương nào</p>
                </td>
              </tr>
            </template>
          </tbody>
        </table>
      </div>
      <div class="table-foot">
        <span class="total-label">{{ meta.total }} tiểu thương</span>
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
          <div class="drawer-title-row">
            <div class="m-avatar lg">{{ initials(detailData?.hoTen) }}</div>
            <div>
              <h3>{{ detailData?.hoTen }}</h3>
              <span class="badge" :class="detailData?.trangThai === 'active' ? 'badge--green' : 'badge--red'">
                {{ detailData?.trangThai === 'active' ? 'Hoạt động' : 'Đã khóa' }}
              </span>
            </div>
          </div>
          <button class="modal-close" @click="detailDrawer = false">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <div class="drawer-body" v-if="detailData">
          <div class="detail-section">
            <div class="detail-section-title">Thông tin cá nhân</div>
            <div class="detail-grid">
              <div class="detail-item"><span class="detail-label">CCCD</span><span class="detail-val mono">{{ detailData.CCCD }}</span></div>
              <div class="detail-item"><span class="detail-label">Số điện thoại</span><span class="detail-val">{{ detailData.soDienThoai || '—' }}</span></div>
              <div class="detail-item"><span class="detail-label">Mã số thuế</span><span class="detail-val">{{ detailData.maSoThue || '—' }}</span></div>
              <div class="detail-item"><span class="detail-label">Địa chỉ thường trú</span><span class="detail-val">{{ detailData.diaChiThuongTru || '—' }}</span></div>
              <div class="detail-item"><span class="detail-label">Ngày tham gia KD</span><span class="detail-val">{{ fmtDate(detailData.ngayThamGiaKinhDoanh) }}</span></div>
              <div class="detail-item"><span class="detail-label">Ngày đăng ký</span><span class="detail-val">{{ fmtDate(detailData.created_at) }}</span></div>
            </div>
          </div>

          <div class="detail-section">
            <div class="detail-section-title">Quầy đang thuê</div>
            <div v-if="detailData.active_assignments?.length" class="assign-list">
              <div v-for="a in detailData.active_assignments" :key="a.assignment_id" class="assign-card">
                <div class="assign-kiosk">
                  <span class="kiosk-code">{{ a.maKiosk }}</span>
                  <span class="assign-location">{{ a.tenKhu }} · {{ a.tenCho }}</span>
                </div>
                <div class="assign-meta">
                  <span class="cell-sub">Từ {{ fmtDate(a.ngayBatDau) }}</span>
                  <span class="badge badge--blue">Đang thuê</span>
                </div>
              </div>
            </div>
            <div v-else class="empty-assign">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#b0c4b0" stroke-width="1.5"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></svg>
              <span>Chưa có quầy nào đang thuê</span>
            </div>
          </div>
        </div>
        <div class="drawer-footer">
          <button class="btn-ghost" @click="openEdit(detailData)">Chỉnh sửa hồ sơ</button>
          <button class="btn-primary" @click="detailDrawer = false">Đóng</button>
        </div>
      </div>
    </div>

    <Teleport to="body">
      <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
        <div class="modal modal--lg">
          <div class="modal-header">
            <h3>{{ editing ? 'Cập nhật Tiểu thương' : 'Thêm Tiểu thương mới' }}</h3>
            <button class="modal-close" @click="closeModal">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
          <div class="modal-body">
            <div class="section-label">Thông tin cơ bản</div>
            <div class="form-row">
              <div class="field">
                <label>Họ tên <span class="req">*</span></label>
                <input v-model="form.hoTen" placeholder="Nguyễn Thị B" />
              </div>
              <div class="field">
                <label>CCCD <span class="req">*</span></label>
                <input v-model="form.CCCD" placeholder="012345678901" maxlength="12" />
              </div>
            </div>
            <div class="form-row">
              <div class="field">
                <label>Số điện thoại</label>
                <input v-model="form.soDienThoai" placeholder="0901234567" />
              </div>
              <div class="field">
                <label>Mã số thuế</label>
                <input v-model="form.maSoThue" placeholder="0101234567" />
              </div>
            </div>
            <div class="field">
              <label>Địa chỉ thường trú</label>
              <input v-model="form.diaChiThuongTru" placeholder="123 Đường ABC, Quận X, TP.HCM" />
            </div>
            <div class="field">
              <label>Ngày tham gia kinh doanh</label>
              <input v-model="form.ngayThamGiaKinhDoanh" type="date" />
            </div>

            <template v-if="!editing">
              <div class="section-label" style="margin-top:4px">Tài khoản đăng nhập</div>
              <div class="info-note">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                Tiểu thương đăng nhập bằng số điện thoại. Mật khẩu mặc định là <strong>123456</strong> — yêu cầu đổi sau lần đăng nhập đầu.
              </div>
              <div class="field">
                <label>Mật khẩu tuỳ chỉnh <span style="color:#94a894;font-weight:400">(để trống dùng 123456)</span></label>
                <input v-model="form.password" type="password" placeholder="••••••••" />
              </div>
            </template>

            <div class="error-banner" v-if="formError">{{ formError }}</div>
          </div>
          <div class="modal-footer">
            <button class="btn-ghost" @click="closeModal">Hủy</button>
            <button class="btn-primary" @click="submit" :disabled="saving">
              <span v-if="saving" class="spin"></span>
              {{ saving ? 'Đang lưu...' : (editing ? 'Cập nhật' : 'Thêm Tiểu thương') }}
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
const detailDrawer = ref(false)
const editing = ref<any>(null)
const detailData = ref<any>(null)
const formError = ref('')
const items = ref<any[]>([])
const meta = ref({ total: 0, totalPages: 1 })
const quota = ref({ used: 0, max: 0 })

const filters = reactive({ q: '', trangThai: '', has_active_assignment: '' })
const pg = reactive({ page: 1, limit: 10 })
const form = reactive({
  hoTen: '', CCCD: '', soDienThoai: '', maSoThue: '',
  diaChiThuongTru: '', ngayThamGiaKinhDoanh: '', password: ''
})

const quotaPct = computed(() => quota.value.max ? Math.min(100, Math.round(quota.value.used / quota.value.max * 100)) : 0)

let debounceTimer: any
function debouncedFetch() { clearTimeout(debounceTimer); debounceTimer = setTimeout(() => { pg.page = 1; fetchData() }, 400) }

onMounted(async () => {
  try {
    const s = await api.get('/plan_subscription')
    if (s.data?.gioiHanUser) quota.value.max = s.data.gioiHanUser
  } catch {}
  fetchData()
  fetchQuotaUsed()
})

async function fetchQuotaUsed() {
  try {
    const quotaRes = await api.get('/users/account-count')
    quota.value.used = quotaRes.data.total || 0
    
    const planRes = await api.get('/plan_subscription')
    if (planRes.data?.gioiHanUser) quota.value.max = planRes.data.gioiHanUser
  } catch {}
}

async function fetchData() {
  loading.value = true
  try {
    const params: any = { page: pg.page, limit: pg.limit }
    if (filters.q) params.q = filters.q
    if (filters.trangThai) params.trangThai = filters.trangThai
    if (filters.has_active_assignment) params.has_active_assignment = filters.has_active_assignment
    const res = await api.get('/merchant', { params })
    items.value = (res.data.data || []).map((m: any) => ({
      ...m,
      has_kiosk: m.has_active_assignment ?? false
    }))
    meta.value = res.data.meta || { total: 0, totalPages: 1 }
  } catch { items.value = [] }
  finally { loading.value = false }
}

function resetFilters() { filters.q = ''; filters.trangThai = ''; filters.has_active_assignment = ''; pg.page = 1; fetchData() }
function changePage(p: number) { pg.page = p; fetchData() }

async function openDetail(m: any) {
  detailData.value = m
  detailDrawer.value = true
  try {
    const res = await api.get(`/merchant/${m.merchant_id}`)
    detailData.value = res.data
  } catch {}
}

function openCreate() {
  editing.value = null
  Object.assign(form, { hoTen: '', CCCD: '', soDienThoai: '', maSoThue: '', diaChiThuongTru: '', ngayThamGiaKinhDoanh: '', password: '' })
  formError.value = ''; showModal.value = true
}

function openEdit(m: any) {
  editing.value = m
  Object.assign(form, {
    hoTen: m.hoTen || '', CCCD: m.CCCD || '',
    soDienThoai: m.soDienThoai || '', maSoThue: m.maSoThue || '',
    diaChiThuongTru: m.diaChiThuongTru || '',
    ngayThamGiaKinhDoanh: m.ngayThamGiaKinhDoanh?.split('T')[0] || '',
    password: ''
  })
  formError.value = ''
  detailDrawer.value = false
  showModal.value = true
}

function closeModal() { showModal.value = false }

async function toggleStatus(m: any) {
  const newStatus = m.trangThai === 'active' ? 'inactive' : 'active'
  try {
    await api.patch(`/merchant/${m.merchant_id}/status`, { trangThai: newStatus })
    m.trangThai = newStatus
  } catch (e: any) { alert(e.response?.data?.message || 'Lỗi cập nhật trạng thái') }
}

async function submit() {
  if (!form.hoTen.trim()) { formError.value = 'Vui lòng nhập họ tên'; return }
  if (!form.CCCD || form.CCCD.length !== 12) { formError.value = 'CCCD phải đủ 12 ký tự'; return }

  saving.value = true; formError.value = ''
  try {
    const payload: any = {
      hoTen: form.hoTen.trim(),
      CCCD: form.CCCD.trim(),
      soDienThoai: form.soDienThoai || null,
      maSoThue: form.maSoThue || null,
      diaChiThuongTru: form.diaChiThuongTru || null,
      ngayThamGiaKinhDoanh: form.ngayThamGiaKinhDoanh || null,
    }
    if (!editing.value && form.password) payload.password = form.password

    if (editing.value) await api.put(`/merchant/${editing.value.merchant_id}`, payload)
    else await api.post('/merchant', payload)

    closeModal(); fetchData(); fetchQuotaUsed()
  } catch (e: any) { formError.value = e.response?.data?.message || 'Lỗi khi lưu' }
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
.search-wrap { flex: 1; min-width: 200px; max-width: 280px; position: relative; display: flex; align-items: center; }
.search-wrap svg { position: absolute; left: 11px; color: #94a894; pointer-events: none; }
.search-wrap input { width: 100%; height: 38px; padding: 0 12px 0 33px; border: 1.5px solid #d4e4d4; border-radius: 10px; font-size: 13px; font-family: 'Be Vietnam Pro', sans-serif; color: #1a2e1a; background: white; outline: none; }
.search-wrap input:focus { border-color: #3d8c3d; }
select { height: 38px; padding: 0 10px; border: 1.5px solid #d4e4d4; border-radius: 10px; font-size: 13px; font-family: 'Be Vietnam Pro', sans-serif; color: #1a2e1a; background: white; outline: none; }

.quota-bar { background: white; border: 1px solid #e2ede2; border-radius: 12px; padding: 12px 16px; display: flex; flex-direction: column; gap: 8px; }
.quota-info { display: flex; align-items: center; gap: 8px; font-size: 13px; color: #4a654a; }
.quota-info strong { color: #1a2e1a; }
.quota-note { font-size: 11.5px; color: #94a894; margin-left: 4px; }
.quota-track { height: 6px; background: #f0f5f0; border-radius: 3px; overflow: hidden; }
.quota-fill { height: 100%; background: #3d8c3d; border-radius: 3px; transition: width 0.3s; }
.quota-fill--warn { background: #f97316; }
.quota-fill--full { background: #dc2626; }

.table-panel { background: white; border: 1px solid #e2ede2; border-radius: 14px; overflow: hidden; }
.table-wrap { overflow-x: auto; }
.data-table { width: 100%; border-collapse: collapse; }
.data-table th { padding: 11px 14px; font-size: 11px; font-weight: 600; color: #94a894; text-transform: uppercase; letter-spacing: .06em; text-align: left; background: #fafcfa; border-bottom: 1px solid #f0f5f0; white-space: nowrap; }
.data-table td { padding: 13px 14px; border-bottom: 1px solid #f7faf7; vertical-align: middle; }
.row-clickable { cursor: pointer; }
.data-table tbody tr.row-clickable:hover td { background: #fafcfa; }
.data-table tbody tr:last-child td { border-bottom: none; }

.cell-with-avatar { display: flex; align-items: center; gap: 10px; }
.m-avatar { width: 34px; height: 34px; background: #7c3aed; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 700; color: white; flex-shrink: 0; }
.m-avatar.lg { width: 44px; height: 44px; font-size: 14px; }
.cell-main { font-size: 13.5px; font-weight: 500; color: #1a2e1a; }
.cell-sub { font-size: 12px; color: #6b836b; }
.cell-mono { font-size: 12.5px; color: #4a654a; font-family: monospace; }
.cell-date { font-size: 12.5px; color: #6b836b; white-space: nowrap; }
.kiosk-badge { display: inline-flex; align-items: center; gap: 5px; background: #eff6ff; color: #1d4ed8; padding: 3px 9px; border-radius: 20px; font-size: 11.5px; font-weight: 500; }
.badge { display: inline-flex; align-items: center; padding: 3px 9px; border-radius: 20px; font-size: 11.5px; font-weight: 500; }
.badge--green { background: #eef7ee; color: #2d6e2d; }
.badge--red { background: #fef2f2; color: #dc2626; }
.badge--blue { background: #eff6ff; color: #1d4ed8; }

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

/* Drawer */
.drawer-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.3); z-index: 200; display: flex; justify-content: flex-end; }
.drawer { width: 420px; max-width: 95vw; background: white; height: 100%; display: flex; flex-direction: column; box-shadow: -4px 0 32px rgba(0,0,0,0.12); }
.drawer-header { padding: 20px 22px 16px; border-bottom: 1px solid #f0f5f0; display: flex; justify-content: space-between; align-items: flex-start; }
.drawer-title-row { display: flex; align-items: center; gap: 14px; }
.drawer-title-row h3 { font-size: 17px; font-weight: 600; color: #1a2e1a; margin: 0 0 6px; }
.drawer-body { flex: 1; overflow-y: auto; padding: 20px 22px; display: flex; flex-direction: column; gap: 22px; }
.drawer-footer { padding: 14px 22px; border-top: 1px solid #f0f5f0; display: flex; justify-content: flex-end; gap: 10px; }

.detail-section-title { font-size: 11px; font-weight: 600; color: #94a894; text-transform: uppercase; letter-spacing: .07em; margin-bottom: 12px; }
.detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.detail-item { display: flex; flex-direction: column; gap: 3px; }
.detail-label { font-size: 11.5px; color: #94a894; }
.detail-val { font-size: 13.5px; color: #1a2e1a; font-weight: 500; }
.detail-val.mono { font-family: monospace; }

.assign-list { display: flex; flex-direction: column; gap: 8px; }
.assign-card { background: #f7faf7; border: 1px solid #e2ede2; border-radius: 10px; padding: 12px 14px; }
.assign-kiosk { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; }
.assign-location { font-size: 12.5px; color: #6b836b; }
.assign-meta { display: flex; align-items: center; justify-content: space-between; }
.kiosk-code { font-size: 13px; font-weight: 600; color: #1a2e1a; background: #f0f5f0; padding: 3px 8px; border-radius: 6px; font-family: monospace; }
.empty-assign { display: flex; align-items: center; gap: 8px; color: #94a894; font-size: 13px; padding: 12px 0; }

/* Buttons */
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
.modal--lg { max-width: 1000px; }
.modal-header { display: flex; justify-content: space-between; align-items: center; padding: 18px 22px 14px; border-bottom: 1px solid #f0f5f0; }
.modal-header h3 { font-size: 15px; font-weight: 600; color: #1a2e1a; margin: 0; }
.modal-close { background: none; border: none; color: #94a894; cursor: pointer; display: flex; align-items: center; padding: 4px; border-radius: 6px; }
.modal-close:hover { background: #f0f5f0; }
.modal-body { padding: 18px 22px; display: flex; flex-direction: column; gap: 14px; }
.modal-footer { display: flex; justify-content: flex-end; gap: 10px; padding: 14px 22px; border-top: 1px solid #f0f5f0; }
.section-label { font-size: 11px; font-weight: 600; color: #94a894; text-transform: uppercase; letter-spacing: .07em; }
.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.field { display: flex; flex-direction: column; gap: 5px; }
.field label { font-size: 12.5px; font-weight: 500; color: #3a4f3a; }
.req { color: #dc2626; }
.field input { width: 100%; height: 40px; padding: 0 12px; border: 1.5px solid #d4e4d4; border-radius: 10px; font-size: 13.5px; font-family: 'Be Vietnam Pro', sans-serif; color: #1a2e1a; background: #fbfdfb; outline: none; }
.field input:focus { border-color: #3d8c3d; background: white; }
.info-note { display: flex; align-items: flex-start; gap: 8px; background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 10px 12px; font-size: 12.5px; color: #1e40af; line-height: 1.5; flex-wrap: wrap; }
.info-note svg { flex-shrink: 0; margin-top: 1px; }
.error-banner { background: #fef2f2; border: 1px solid #fecaca; border-radius: 9px; padding: 10px 14px; color: #b91c1c; font-size: 13px; }
.spin { width: 14px; height: 14px; border: 2px solid rgba(255,255,255,.35); border-top-color: white; border-radius: 50%; animation: spin .65s linear infinite; display: inline-block; }
@keyframes spin { to { transform: rotate(360deg); } }
</style>