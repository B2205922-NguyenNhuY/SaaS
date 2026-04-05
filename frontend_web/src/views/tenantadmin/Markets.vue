<template>
  <div class="page">
    <div class="page-header">
      <div>
        <h1 class="page-title">Danh sách Chợ</h1>
      </div>
      <button class="btn-primary" @click="openCreate">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        Thêm Chợ
      </button>
    </div>

    <div class="filter-bar">
      <div class="search-wrap">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <input v-model="filters.q" placeholder="Tìm tên chợ, địa chỉ..." @input="debouncedFetch" />
      </div>
      <select v-model="filters.trangThai" @change="fetchData">
        <option value="">Tất cả trạng thái</option>
        <option value="active">Hoạt động</option>
        <option value="locked">Đã khóa</option>
      </select>
      <button class="btn-outline" @click="resetFilters">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-4.95"/></svg>
        Reset
      </button>
    </div>

    <div class="quota-bar" v-if="quota.max">
      <div class="quota-info">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>
        <span>Đã dùng <strong>{{ quota.used }}</strong> / <strong>{{ quota.max }}</strong> chợ theo gói cước</span>
      </div>
      <div class="quota-track">
        <div class="quota-fill" :style="{ width: quotaPct + '%' }" :class="{ 'quota-fill--warn': quotaPct >= 80 }"></div>
      </div>
    </div>

    <div class="table-panel">
      <div class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>Tên chợ</th>
              <th>Địa chỉ</th>
              <th>Diện tích</th>
              <th>Trạng thái</th>
              <th>Ngày tạo</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading"><td colspan="6"><div class="loading-bar"></div></td></tr>
            <template v-else>
              <tr v-for="m in items" :key="m.market_id">
                <td>
                  <div class="cell-with-avatar">
                    <div class="avatar-sq" :style="{ background: avatarBg(m.tenCho) }">{{ initials(m.tenCho) }}</div>
                    <div class="cell-main">{{ m.tenCho }}</div>
                  </div>
                </td>
                <td class="cell-sub">{{ m.diaChi || '—' }}</td>
                <td class="cell-sub">{{ m.dienTich ? m.dienTich + ' m²' : '—' }}</td>
                <td>
                  <span class="badge" :class="m.trangThai === 'active' ? 'badge--green' : 'badge--red'">
                    {{ m.trangThai === 'active' ? 'Hoạt động' : 'Đã khóa' }}
                  </span>
                </td>
                <td class="cell-date">{{ fmtDate(m.created_at) }}</td>
                <td>
                  <div class="action-btns">
                    <button class="icon-btn" title="Chỉnh sửa" @click="openEdit(m)">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    </button>
                    <button class="icon-btn" title="Xem khu" @click="router.push(`/tenant-admin/zones?market_id=${m.market_id}`)">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M3 15h18M9 3v18M15 3v18"/></svg>
                    </button>
                    <button class="icon-btn" :class="m.trangThai === 'active' ? 'icon-btn--danger' : 'icon-btn--success'" :title="m.trangThai === 'active' ? 'Khóa' : 'Mở khóa'" @click="toggleStatus(m)">
                      <svg v-if="m.trangThai === 'active'" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                      <svg v-else width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/></svg>
                    </button>
                  </div>
                </td>
              </tr>
              <tr v-if="!items.length">
                <td colspan="6" class="empty-row">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#b0c4b0" stroke-width="1.5"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>
                  <p>Chưa có chợ nào</p>
                </td>
              </tr>
            </template>
          </tbody>
        </table>
      </div>
      <div class="table-foot">
        <span class="total-label">{{ meta.total }} kết quả</span>
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
            <h3>{{ editing ? 'Cập nhật Chợ' : 'Thêm Chợ mới' }}</h3>
            <button class="modal-close" @click="closeModal">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
          <div class="modal-body">
            <div class="field">
              <label>Tên chợ <span class="req">*</span></label>
              <input v-model="form.tenCho" placeholder="Chợ Bến Thành" />
            </div>
            <div class="field">
              <label>Địa chỉ</label>
              <input v-model="form.diaChi" placeholder="Lê Lợi, Q1, TP.HCM" />
            </div>
            <div class="field">
              <label>Diện tích (m²)</label>
              <input v-model.number="form.dienTich" type="number" min="1" placeholder="500" />
            </div>
            <div class="error-banner" v-if="formError">{{ formError }}</div>
          </div>
          <div class="modal-footer">
            <button class="btn-ghost" @click="closeModal">Hủy</button>
            <button class="btn-primary" @click="submit" :disabled="saving">
              <span v-if="saving" class="spin"></span>
              {{ saving ? 'Đang lưu...' : (editing ? 'Cập nhật' : 'Thêm Chợ') }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import api from '@/api/axios'

const router = useRouter()
const loading = ref(true)
const saving = ref(false)
const showModal = ref(false)
const editing = ref<any>(null)
const formError = ref('')
const items = ref<any[]>([])
const meta = ref({ total: 0, totalPages: 1 })
const quota = ref({ used: 0, max: 0 })

const filters = reactive({ q: '', trangThai: '' })
const pg = reactive({ page: 1, limit: 10 })
const form = reactive({ tenCho: '', diaChi: '', dienTich: null as number | null })

const quotaPct = computed(() => quota.value.max ? Math.min(100, Math.round(quota.value.used / quota.value.max * 100)) : 0)

let debounceTimer: any
function debouncedFetch() { clearTimeout(debounceTimer); debounceTimer = setTimeout(() => { pg.page = 1; fetchData() }, 400) }

onMounted(async () => {
  await fetchData()
  try {
    const res = await api.get('/plan_subscription')
    if (res.data?.gioiHanSoCho) quota.value.max = res.data.gioiHanSoCho
  } catch {}
})

async function fetchData() {
  loading.value = true
  try {
    const params: any = { page: pg.page, limit: pg.limit }
    if (filters.q) params.q = filters.q
    if (filters.trangThai) params.trangThai = filters.trangThai
    const res = await api.get('/market', { params })
    items.value = res.data.data || []
    meta.value = res.data.meta || { total: 0, totalPages: 1 }
    quota.value.used = meta.value.total
  } catch { items.value = [] }
  finally { loading.value = false }
}

function resetFilters() { filters.q = ''; filters.trangThai = ''; pg.page = 1; fetchData() }
function changePage(p: number) { pg.page = p; fetchData() }

function openCreate() {
  editing.value = null
  Object.assign(form, { tenCho: '', diaChi: '', dienTich: null })
  formError.value = ''; showModal.value = true
}

function openEdit(m: any) {
  editing.value = m
  Object.assign(form, { tenCho: m.tenCho, diaChi: m.diaChi || '', dienTich: m.dienTich || null })
  formError.value = ''; showModal.value = true
}

function closeModal() { showModal.value = false }

async function toggleStatus(m: any) {
  const s = m.trangThai === 'active' ? 'locked' : 'active'
  try { await api.patch(`/market/${m.market_id}/status`, { trangThai: s }); m.trangThai = s }
  catch (e: any) { alert(e.response?.data?.message || 'Lỗi') }
}

async function submit() {
  if (!form.tenCho.trim()) { formError.value = 'Vui lòng nhập tên chợ'; return }
  saving.value = true; formError.value = ''
  try {
    const payload = { tenCho: form.tenCho.trim(), diaChi: form.diaChi || null, dienTich: form.dienTich || null }
    if (editing.value) await api.put(`/market/${editing.value.market_id}`, payload)
    else await api.post('/market', payload)
    closeModal(); fetchData()
  } catch (e: any) { formError.value = e.response?.data?.message || 'Lỗi khi lưu' }
  finally { saving.value = false }
}

function fmtDate(d: string) { return d ? new Date(d).toLocaleDateString('vi-VN') : '—' }
function initials(n: string) { return (n || '?').split(' ').map((w: string) => w[0]).slice(-2).join('').toUpperCase() }
const aC = ['#eef7ee','#eff6ff','#fffbeb','#f5f3ff','#fff1f2']
function avatarBg(n: string) { return aC[(n?.charCodeAt(0) ?? 0) % aC.length] }
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
.quota-track { height: 6px; background: #f0f5f0; border-radius: 3px; overflow: hidden; }
.quota-fill { height: 100%; background: #3d8c3d; border-radius: 3px; transition: width 0.3s; }
.quota-fill--warn { background: #f97316; }
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
.modal { background: white; border-radius: 16px; width: 100%; max-width: 1000px; max-height: 90vh; overflow-y: auto; box-shadow: 0 20px 60px rgba(0,0,0,0.15); }
.modal-header { display: flex; justify-content: space-between; align-items: center; padding: 18px 22px 14px; border-bottom: 1px solid #f0f5f0; }
.modal-header h3 { font-size: 15px; font-weight: 600; color: #1a2e1a; margin: 0; }
.modal-close { background: none; border: none; color: #94a894; cursor: pointer; display: flex; align-items: center; padding: 4px; border-radius: 6px; }
.modal-close:hover { background: #f0f5f0; }
.modal-body { padding: 18px 22px; display: flex; flex-direction: column; gap: 14px; }
.modal-footer { display: flex; justify-content: flex-end; gap: 10px; padding: 14px 22px; border-top: 1px solid #f0f5f0; }
.field { display: flex; flex-direction: column; gap: 5px; }
.field label { font-size: 12.5px; font-weight: 500; color: #3a4f3a; }
.req { color: #dc2626; }
.field input { width: 100%; height: 40px; padding: 0 12px; border: 1.5px solid #d4e4d4; border-radius: 10px; font-size: 13.5px; font-family: 'Be Vietnam Pro', sans-serif; color: #1a2e1a; background: #fbfdfb; outline: none; }
.field input:focus { border-color: #3d8c3d; background: white; }
.error-banner { background: #fef2f2; border: 1px solid #fecaca; border-radius: 9px; padding: 10px 14px; color: #b91c1c; font-size: 13px; }
.spin { width: 14px; height: 14px; border: 2px solid rgba(255,255,255,.35); border-top-color: white; border-radius: 50%; animation: spin .65s linear infinite; display: inline-block; }
@keyframes spin { to { transform: rotate(360deg); } }
</style>