<template>
  <div class="page">
    <div class="page-header">
      <div>
        <h1 class="page-title">Kỳ thu</h1>
      </div>
      <button class="btn-primary" @click="openCreate">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        Tạo Kỳ thu
      </button>
    </div>

    <div class="filter-bar">
      <div class="search-wrap">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <input v-model="filters.q" placeholder="Tìm tên kỳ thu..." @input="debouncedFetch" />
      </div>
      <select v-model="filters.loaiKy" @change="fetchData">
        <option value="">Tất cả loại</option>
        <option value="ngay">Theo ngày</option>
        <option value="thang">Theo tháng</option>
      </select>
    </div>

    <div class="table-panel">
      <div class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>Tên kỳ thu</th>
              <th>Loại kỳ</th>
              <th>Ngày bắt đầu</th>
              <th>Ngày kết thúc</th>
              <th>Số khoản thu</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading"><td colspan="6"><div class="loading-bar"></div></td></tr>
            <template v-else>
              <tr v-for="p in items" :key="p.period_id" class="row-clickable" @click="openDetail(p)">
                <td class="cell-main">{{ p.tenKyThu || `Kỳ #${p.period_id}` }}</td>
                <td>
                  <span class="badge" :class="p.loaiKy === 'ngay' ? 'badge--blue' : 'badge--purple'">
                    {{ p.loaiKy === 'ngay' ? 'Theo ngày' : 'Theo tháng' }}
                  </span>
                </td>
                <td class="cell-date">{{ fmtDate(p.ngayBatDau) }}</td>
                <td class="cell-date">{{ fmtDate(p.ngayKetThuc) }}</td>
                <td>
                  <router-link :to="`/tenant-admin/charges?period_id=${p.period_id}`" class="link-count" @click.stop>
                    Xem khoản thu →
                  </router-link>
                </td>
                <td @click.stop>
                  <div class="action-btns">
                    <button class="icon-btn" title="Chỉnh sửa" @click="openEdit(p)">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    </button>
                    <button class="icon-btn icon-btn--danger" title="Xóa" @click="deletePeriod(p)">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                    </button>
                  </div>
                </td>
              </tr>
              <tr v-if="!items.length">
                <td colspan="6" class="empty-row">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#b0c4b0" stroke-width="1.5"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                  <p>Chưa có kỳ thu nào</p>
                </td>
              </tr>
            </template>
          </tbody>
        </table>
      </div>
      <div class="table-foot">
        <span class="total-label">{{ meta.total }} kỳ thu</span>
        <div class="pagination" v-if="meta.totalPages > 1">
          <button :disabled="pg.page <= 1" @click="changePage(pg.page-1)">← Trước</button>
          <span>{{ pg.page }} / {{ meta.totalPages }}</span>
          <button :disabled="pg.page >= meta.totalPages" @click="changePage(pg.page+1)">Tiếp →</button>
        </div>
      </div>
    </div>

    <Teleport to="body">
      <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
        <div class="modal">
          <div class="modal-header">
            <h3>{{ editing ? 'Cập nhật Kỳ thu' : 'Tạo Kỳ thu mới' }}</h3>
            <button class="modal-close" @click="closeModal">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
          <div class="modal-body">
            <div class="field">
              <label>Tên kỳ thu</label>
              <input v-model="form.tenKyThu" placeholder="VD: Kỳ thu tháng 1/2025" />
            </div>
            <div class="form-row">
              <div class="field">
                <label>Loại kỳ <span class="req">*</span></label>
                <select v-model="form.loaiKy">
                  <option value="ngay">Theo ngày</option>
                  <option value="thang">Theo tháng</option>
                </select>
              </div>
            </div>
            <div class="form-row">
              <div class="field">
                <label>Ngày bắt đầu <span class="req">*</span></label>
                <input v-model="form.ngayBatDau" type="datetime-local" />
              </div>
              <div class="field">
                <label>Ngày kết thúc <span class="req">*</span></label>
                <input v-model="form.ngayKetThuc" type="datetime-local" />
              </div>
            </div>
            <div class="info-note" v-if="!editing">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              <span>Khi tạo kỳ thu, hệ thống sẽ <strong>tự động sinh khoản thu</strong> cho tất cả kiosk đang có tiểu thương thuê và đã được gán biểu phí.</span>
            </div>
            <div class="error-banner" v-if="formError">{{ formError }}</div>
          </div>
          <div class="modal-footer">
            <button class="btn-ghost" @click="closeModal">Hủy</button>
            <button class="btn-primary" @click="submit" :disabled="saving">
              <span v-if="saving" class="spin"></span>
              {{ saving ? (editing ? 'Đang cập nhật...' : 'Đang tạo kỳ thu...') : (editing ? 'Cập nhật' : 'Tạo Kỳ thu') }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import api from '@/api/axios'

const route = useRoute()
const loading = ref(true)
const saving  = ref(false)
const showModal = ref(false)
const editing   = ref<any>(null)
const formError = ref('')
const items = ref<any[]>([])
const meta  = ref({ total: 0, totalPages: 1 })
const pg    = reactive({ page: 1, limit: 10 })
const filters = reactive({ q: '', loaiKy: '' })
const form  = reactive({ tenKyThu: '', loaiKy: 'thang', ngayBatDau: '', ngayKetThuc: '' })

let debounceTimer: any
function debouncedFetch() { clearTimeout(debounceTimer); debounceTimer = setTimeout(() => { pg.page = 1; fetchData() }, 400) }

onMounted(() => fetchData())

async function fetchData() {
  loading.value = true
  try {
    const p: any = { page: pg.page, limit: pg.limit }
    if (filters.q) p.q = filters.q
    const res = await api.get('/collection_periods', { params: p })
    let data = res.data.data || []
    if (filters.loaiKy) data = data.filter((x: any) => x.loaiKy === filters.loaiKy)
    items.value = data
    meta.value  = res.data.meta || { total: 0, totalPages: 1 }
  } catch { items.value = [] }
  finally { loading.value = false }
}

function changePage(p: number) { pg.page = p; fetchData() }
function resetFilters() { filters.q = ''; filters.loaiKy = ''; pg.page = 1; fetchData() }

function openCreate() {
  editing.value = null
  Object.assign(form, { tenKyThu: '', loaiKy: 'thang', ngayBatDau: '', ngayKetThuc: '' })
  formError.value = ''; showModal.value = true
}

function openEdit(p: any) {
  editing.value = p
  Object.assign(form, {
    tenKyThu: p.tenKyThu || '', loaiKy: p.loaiKy,
    ngayBatDau: p.ngayBatDau?.slice(0, 16) || '',
    ngayKetThuc: p.ngayKetThuc?.slice(0, 16) || '',
  })
  formError.value = ''; showModal.value = true
}

function openDetail(p: any) {
}

function closeModal() { showModal.value = false }

async function submit() {
  if (!form.ngayBatDau || !form.ngayKetThuc) { formError.value = 'Vui lòng chọn ngày bắt đầu và kết thúc'; return }
  if (new Date(form.ngayBatDau) >= new Date(form.ngayKetThuc)) { formError.value = 'Ngày kết thúc phải sau ngày bắt đầu'; return }
  saving.value = true; formError.value = ''
  try {
    const payload = { tenKyThu: form.tenKyThu || null, loaiKy: form.loaiKy, ngayBatDau: form.ngayBatDau, ngayKetThuc: form.ngayKetThuc }
    if (editing.value) await api.put(`/collection_periods/${editing.value.period_id}`, payload)
    else await api.post('/collection_periods', payload)
    closeModal(); fetchData()
  } catch (e: any) { formError.value = e.response?.data?.message || 'Lỗi khi lưu' }
  finally { saving.value = false }
}

async function deletePeriod(p: any) {
  if (!confirm(`Xóa kỳ thu "${p.tenKyThu || `#${p.period_id}`}"? Chỉ xóa được nếu chưa có khoản thu nào.`)) return
  try { await api.delete(`/collection_periods/${p.period_id}`); fetchData() }
  catch (e: any) { alert(e.response?.data?.message || 'Lỗi xóa') }
}

function fmtDate(d: string) { return d ? new Date(d).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—' }
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
.cell-date { font-size: 12.5px; color: #6b836b; white-space: nowrap; }
.badge { display: inline-flex; align-items: center; padding: 3px 9px; border-radius: 20px; font-size: 11.5px; font-weight: 500; }
.badge--blue   { background: #eff6ff; color: #1d4ed8; }
.badge--purple { background: #f5f3ff; color: #6d28d9; }
.link-count { font-size: 12.5px; color: #3d8c3d; text-decoration: none; font-weight: 500; }
.link-count:hover { text-decoration: underline; }
.action-btns { display: flex; gap: 5px; }
.icon-btn { width: 30px; height: 30px; background: none; border: 1px solid #e2ede2; border-radius: 7px; display: flex; align-items: center; justify-content: center; cursor: pointer; color: #4a654a; transition: all .15s; }
.icon-btn:hover { background: #f0f7f0; }
.icon-btn--danger { color: #dc2626; border-color: #fecaca; }
.icon-btn--danger:hover { background: #fef2f2; }
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
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 1rem; }
.modal { background: white; border-radius: 16px; width: 100%; max-width: 1000px; max-height: 90vh; overflow-y: auto; box-shadow: 0 20px 60px rgba(0,0,0,0.15); }
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
.field input, .field select { width: 100%; height: 40px; padding: 0 12px; border: 1.5px solid #d4e4d4; border-radius: 10px; font-size: 13.5px; font-family: 'Be Vietnam Pro', sans-serif; color: #1a2e1a; background: #fbfdfb; outline: none; }
.field input:focus, .field select:focus { border-color: #3d8c3d; background: white; }
.info-note { display: flex; align-items: flex-start; gap: 10px; background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 10px 14px; font-size: 13px; color: #1e40af; line-height: 1.55; }
.info-note svg { flex-shrink: 0; margin-top: 1px; }
.error-banner { background: #fef2f2; border: 1px solid #fecaca; border-radius: 9px; padding: 10px 14px; color: #b91c1c; font-size: 13px; }
.spin { width: 14px; height: 14px; border: 2px solid rgba(255,255,255,.35); border-top-color: white; border-radius: 50%; animation: spin .65s linear infinite; display: inline-block; }
@keyframes spin { to { transform: rotate(360deg); } }
</style>