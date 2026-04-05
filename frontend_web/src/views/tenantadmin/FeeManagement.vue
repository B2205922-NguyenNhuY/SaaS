<template>
  <div class="page">
    <div class="page-header">
      <div>
        <h1 class="page-title">Quản lý Biểu phí</h1>
      </div>
      <button class="btn-primary" @click="openCreate">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        {{ activeTab === 'fees' ? 'Thêm Biểu phí' : 'Gán Biểu phí' }}
      </button>
    </div>

    <div class="tabs">
      <button class="tab" :class="{ 'tab--active': activeTab === 'fees' }" @click="activeTab = 'fees'">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
        Biểu phí
      </button>
      <button class="tab" :class="{ 'tab--active': activeTab === 'assignments' }" @click="activeTab = 'assignments'">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>
        Áp dụng biểu phí
      </button>
    </div>

    <template v-if="activeTab === 'fees'">
      <div class="filter-bar">
        <div class="search-wrap">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input v-model="fFilters.q" placeholder="Tìm biểu phí..." @input="debouncedFetchF" />
        </div>
        <select v-model="fFilters.hinhThuc" @change="fetchFees">
          <option value="">Tất cả hình thức</option>
          <option value="ngay">Theo ngày</option>
          <option value="thang">Theo tháng</option>
        </select>
      </div>

      <div class="table-panel">
        <div class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th>Tên biểu phí</th>
                <th>Hình thức</th>
                <th>Đơn giá</th>
                <th>Mô tả</th>
                <th>Ngày tạo</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="fLoading"><td colspan="6"><div class="loading-bar"></div></td></tr>
              <template v-else>
                <tr v-for="f in fees" :key="f.fee_id">
                  <td class="cell-main">{{ f.tenBieuPhi }}</td>
                  <td>
                    <span class="badge" :class="f.hinhThuc === 'ngay' ? 'badge--blue' : 'badge--purple'">
                      {{ f.hinhThuc === 'ngay' ? 'Theo ngày' : 'Theo tháng' }}
                    </span>
                  </td>
                  <td class="cell-money">{{ fmtMoney(f.donGia) }}</td>
                  <td class="cell-sub">{{ f.moTa || '—' }}</td>
                  <td class="cell-date">{{ fmtDate(f.created_at) }}</td>
                  <td>
                    <div class="action-btns">
                      <button class="icon-btn" title="Chỉnh sửa" @click="openEditFee(f)">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                      </button>
                      <button class="icon-btn icon-btn--danger" title="Xóa" @click="deleteFee(f)">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                      </button>
                    </div>
                  </td>
                </tr>
                <tr v-if="!fees.length">
                  <td colspan="6" class="empty-row">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#b0c4b0" stroke-width="1.5"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                    <p>Chưa có biểu phí nào</p>
                  </td>
                </tr>
              </template>
            </tbody>
          </table>
        </div>
        <div class="table-foot">
          <span class="total-label">{{ fMeta.total }} biểu phí</span>
          <div class="pagination" v-if="fMeta.totalPages > 1">
            <button :disabled="fPg.page <= 1" @click="changeFPage(fPg.page-1)">← Trước</button>
            <span>{{ fPg.page }} / {{ fMeta.totalPages }}</span>
            <button :disabled="fPg.page >= fMeta.totalPages" @click="changeFPage(fPg.page+1)">Tiếp →</button>
          </div>
        </div>
      </div>
    </template>

    <template v-if="activeTab === 'assignments'">
      <div class="filter-bar">
        <select v-model="aFilters.target_type" @change="fetchAssignments">
          <option value="">Tất cả loại</option>
          <option value="kiosk">Theo Kiosk</option>
          <option value="zone">Theo Khu</option>
          <option value="kiosk_type">Theo Loại Kiosk</option>
        </select>
        <select v-model="aFilters.fee_id" @change="fetchAssignments">
          <option value="">Tất cả biểu phí</option>
          <option v-for="f in allFees" :key="f.fee_id" :value="f.fee_id">{{ f.tenBieuPhi }}</option>
        </select>
        <select v-model="aFilters.trangThai" @change="fetchAssignments">
          <option value="">Tất cả TT</option>
          <option value="active">Đang áp dụng</option>
          <option value="inactive">Đã ngưng</option>
        </select>
      </div>

      <div class="table-panel">
        <div class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th>Biểu phí</th>
                <th>Loại áp dụng</th>
                <th>Đối tượng</th>
                <th>Đơn giá</th>
                <th>Miễn giảm</th>
                <th>Ngày áp dụng</th>
                <th>Trạng thái</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="aLoading"><td colspan="8"><div class="loading-bar"></div></td></tr>
              <template v-else>
                <tr v-for="a in assignments" :key="a.assignment_id">
                  <td class="cell-main">{{ a.tenBieuPhi }}</td>
                  <td>
                    <span class="badge badge--gray">{{ targetTypeLabel(a.target_type) }}</span>
                  </td>
                  <td class="cell-sub">{{ a.target_id }}</td>
                  <td class="cell-money">{{ fmtMoney(a.donGia) }}</td>
                  <td class="cell-sub">{{ a.mucMienGiam ? a.mucMienGiam + '%' : '—' }}</td>
                  <td class="cell-date">{{ fmtDate(a.ngayApDung) }}</td>
                  <td>
                    <span class="badge" :class="a.trangThai === 'active' ? 'badge--green' : 'badge--red'">
                      {{ a.trangThai === 'active' ? 'Đang áp dụng' : 'Đã ngưng' }}
                    </span>
                  </td>
                  <td>
                    <button v-if="a.trangThai === 'active'" class="icon-btn icon-btn--danger" title="Ngưng áp dụng" @click="deactivateAssignment(a)">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
                    </button>
                    <span v-else class="cell-sub">—</span>
                  </td>
                </tr>
                <tr v-if="!assignments.length">
                  <td colspan="8" class="empty-row">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#b0c4b0" stroke-width="1.5"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/></svg>
                    <p>Chưa có áp dụng biểu phí nào</p>
                  </td>
                </tr>
              </template>
            </tbody>
          </table>
        </div>
        <div class="table-foot">
          <span class="total-label">{{ aMeta.total }} áp dụng</span>
          <div class="pagination" v-if="aMeta.totalPages > 1">
            <button :disabled="aPg.page <= 1" @click="changeAPage(aPg.page-1)">← Trước</button>
            <span>{{ aPg.page }} / {{ aMeta.totalPages }}</span>
            <button :disabled="aPg.page >= aMeta.totalPages" @click="changeAPage(aPg.page+1)">Tiếp →</button>
          </div>
        </div>
      </div>
    </template>

    <Teleport to="body">
      <div v-if="showFeeModal" class="modal-overlay" @click.self="showFeeModal = false">
        <div class="modal">
          <div class="modal-header">
            <h3>{{ editingFee ? 'Cập nhật Biểu phí' : 'Thêm Biểu phí mới' }}</h3>
            <button class="modal-close" @click="showFeeModal = false">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
          <div class="modal-body">
            <div class="field">
              <label>Tên biểu phí <span class="req">*</span></label>
              <input v-model="fForm.tenBieuPhi" placeholder="VD: Phí thuê sạp thực phẩm" />
            </div>
            <div class="form-row">
              <div class="field">
                <label>Hình thức <span class="req">*</span></label>
                <select v-model="fForm.hinhThuc">
                  <option value="ngay">Theo ngày</option>
                  <option value="thang">Theo tháng</option>
                </select>
              </div>
              <div class="field">
                <label>Đơn giá (VNĐ) <span class="req">*</span></label>
                <input v-model.number="fForm.donGia" type="number" min="0" placeholder="50000" />
              </div>
            </div>
            <div class="field">
              <label>Mô tả</label>
              <input v-model="fForm.moTa" placeholder="Mô tả ngắn..." />
            </div>
            <div class="error-banner" v-if="fFormError">{{ fFormError }}</div>
          </div>
          <div class="modal-footer">
            <button class="btn-ghost" @click="showFeeModal = false">Hủy</button>
            <button class="btn-primary" @click="submitFee" :disabled="saving">
              <span v-if="saving" class="spin"></span>
              {{ saving ? 'Đang lưu...' : (editingFee ? 'Cập nhật' : 'Thêm') }}
            </button>
          </div>
        </div>
      </div>

      <div v-if="showAssignModal" class="modal-overlay" @click.self="showAssignModal = false">
        <div class="modal">
          <div class="modal-header">
            <h3>Gán Biểu phí</h3>
            <button class="modal-close" @click="showAssignModal = false">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
          <div class="modal-body">
            <div class="field">
              <label>Biểu phí <span class="req">*</span></label>
              <select v-model="aForm.fee_id">
                <option value="">-- Chọn biểu phí --</option>
                <option v-for="f in allFees" :key="f.fee_id" :value="f.fee_id">{{ f.tenBieuPhi }} — {{ fmtMoney(f.donGia) }}/{{ f.hinhThuc === 'ngay' ? 'ngày' : 'tháng' }}</option>
              </select>
            </div>
            <div class="form-row">
              <div class="field">
                <label>Loại áp dụng <span class="req">*</span></label>
                <select v-model="aForm.target_type" @change="onTargetTypeChange">
                  <option value="">-- Chọn loại --</option>
                  <option value="all_markets">Toàn bộ chợ (tất cả khu)</option>
                  <option value="market">Chợ chỉ định</option>
                  <option value="kiosk_type">Loại Kiosk</option>
                  <option value="zone">Khu vực cụ thể</option>
                  <option value="kiosk">Kiosk cụ thể</option>
                </select>
              </div>
              <div class="field">
                <label>Đối tượng <span class="req" v-if="aForm.target_type !== 'all_markets'">*</span></label>
                <select v-if="aForm.target_type === 'market'" v-model="aForm.target_id">
                  <option value="">-- Chọn chợ --</option>
                  <option v-for="m in allMarkets" :key="m.market_id" :value="m.market_id">{{ m.tenCho }}</option>
                </select>
                <select v-else-if="aForm.target_type === 'zone'" v-model="aForm.target_id">
                  <option value="">-- Chọn khu --</option>
                  <option v-for="z in allZones" :key="z.zone_id" :value="z.zone_id">{{ z.tenKhu }}</option>
                </select>
                <select v-else-if="aForm.target_type === 'kiosk_type'" v-model="aForm.target_id">
                  <option value="">-- Chọn loại --</option>
                  <option v-for="t in allKioskTypes" :key="t.type_id" :value="t.type_id">{{ t.tenLoai }}</option>
                </select>
                <select v-else-if="aForm.target_type === 'kiosk'" v-model="aForm.target_id">
                  <option value="">-- Chọn kiosk --</option>
                  <option v-for="k in allKiosks" :key="k.kiosk_id" :value="k.kiosk_id">{{ k.maKiosk }}</option>
                </select>
                <input v-else-if="aForm.target_type === 'all_markets'" disabled placeholder="Áp dụng tất cả khu vực" />
                <input v-else disabled placeholder="Chọn loại trước" />
              </div>
            </div>
            <div class="info-note" v-if="aForm.target_type === 'all_markets'">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              <span>Biểu phí sẽ được gán cho <strong>tất cả {{ allZones.length }} khu vực</strong> thuộc tất cả chợ bạn quản lý.</span>
            </div>
            <div class="info-note" v-else-if="aForm.target_type === 'market' && aForm.target_id">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              <span>Biểu phí sẽ được gán cho <strong>{{ zonesOfSelectedMarket.length }} khu vực</strong> thuộc chợ này.</span>
            </div>
            <div class="form-row">
              <div class="field">
                <label>Ngày áp dụng <span class="req">*</span></label>
                <input v-model="aForm.ngayApDung" type="date" />
              </div>
              <div class="field">
                <label>Miễn giảm (%)</label>
                <input v-model.number="aForm.mucMienGiam" type="number" min="0" max="100" placeholder="0" />
              </div>
            </div>
            <div class="error-banner" v-if="aFormError">{{ aFormError }}</div>
          </div>
          <div class="modal-footer">
            <button class="btn-ghost" @click="showAssignModal = false">Hủy</button>
            <button class="btn-primary" @click="submitAssign" :disabled="saving">
              <span v-if="saving" class="spin"></span>
              {{ saving ? 'Đang lưu...' : 'Gán biểu phí' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted } from 'vue'
import api from '@/api/axios'

const activeTab = ref<'fees' | 'assignments'>('fees')
const saving = ref(false)

watch(activeTab, (t) => {
  if (t === 'fees') fetchFees()
  else fetchAssignments()
})

const allFees       = ref<any[]>([])
const allZones      = ref<any[]>([])
const allMarkets    = ref<any[]>([])
const allKioskTypes = ref<any[]>([])
const allKiosks     = ref<any[]>([])

const zonesOfSelectedMarket = computed(() =>
  aForm.target_id ? allZones.value.filter((z: any) => z.market_id == aForm.target_id) : []
)

onMounted(async () => {
  await Promise.all([
    fetchFees(),
    api.get('/fees', { params: { limit: 200 } }).then(r => allFees.value = r.data.data || []).catch(() => {}),
    api.get('/zone', { params: { limit: 500 } }).then(r => allZones.value = r.data.data || []).catch(() => {}),
    api.get('/market', { params: { limit: 200 } }).then(r => allMarkets.value = r.data.data || []).catch(() => {}),
    api.get('/kioskType', { params: { limit: 100 } }).then(r => allKioskTypes.value = r.data.data || []).catch(() => {}),
    api.get('/kiosk', { params: { limit: 500 } }).then(r => allKiosks.value = r.data.data || []).catch(() => {}),
  ])
})

const fLoading = ref(true)
const fees     = ref<any[]>([])
const fMeta    = ref({ total: 0, totalPages: 1 })
const fPg      = reactive({ page: 1, limit: 10 })
const fFilters = reactive({ q: '', hinhThuc: '' })
const showFeeModal = ref(false)
const editingFee   = ref<any>(null)
const fFormError   = ref('')
const fForm = reactive({ tenBieuPhi: '', hinhThuc: 'thang', donGia: null as number | null, moTa: '' })

let fDebounce: any
function debouncedFetchF() { clearTimeout(fDebounce); fDebounce = setTimeout(() => { fPg.page = 1; fetchFees() }, 400) }

async function fetchFees() {
  fLoading.value = true
  try {
    const p: any = { page: fPg.page, limit: fPg.limit }
    if (fFilters.q) p.q = fFilters.q
    if (fFilters.hinhThuc) p.hinhThuc = fFilters.hinhThuc
    const res = await api.get('/fees', { params: p })
    fees.value = res.data.data || []
    fMeta.value = res.data.meta || { total: 0, totalPages: 1 }
    if (!fFilters.q && !fFilters.hinhThuc && fPg.page === 1) {
      allFees.value = fees.value
    }
  } catch { fees.value = [] }
  finally { fLoading.value = false }
}

function changeFPage(p: number) { fPg.page = p; fetchFees() }

function openCreate() {
  if (activeTab.value === 'fees') {
    editingFee.value = null
    Object.assign(fForm, { tenBieuPhi: '', hinhThuc: 'thang', donGia: null, moTa: '' })
    fFormError.value = ''; showFeeModal.value = true
  } else {
    Object.assign(aForm, { fee_id: '', target_type: '', target_id: '', ngayApDung: new Date().toISOString().split('T')[0], mucMienGiam: 0 })
    aFormError.value = ''; showAssignModal.value = true
  }
}

function openEditFee(f: any) {
  editingFee.value = f
  Object.assign(fForm, { tenBieuPhi: f.tenBieuPhi, hinhThuc: f.hinhThuc, donGia: f.donGia, moTa: f.moTa || '' })
  fFormError.value = ''; showFeeModal.value = true
}

async function submitFee() {
  if (!fForm.tenBieuPhi.trim() || !fForm.donGia) { fFormError.value = 'Vui lòng điền đầy đủ'; return }
  saving.value = true; fFormError.value = ''
  try {
    const payload = { tenBieuPhi: fForm.tenBieuPhi.trim(), hinhThuc: fForm.hinhThuc, donGia: fForm.donGia, moTa: fForm.moTa || null }
    if (editingFee.value) await api.put(`/fees/${editingFee.value.fee_id}`, payload)
    else await api.post('/fees', payload)
    showFeeModal.value = false; fetchFees()
  } catch (e: any) { fFormError.value = e.response?.data?.message || 'Lỗi khi lưu' }
  finally { saving.value = false }
}

async function deleteFee(f: any) {
  if (!confirm(`Xóa biểu phí "${f.tenBieuPhi}"?`)) return
  try { await api.delete(`/fees/${f.fee_id}`); fetchFees() }
  catch (e: any) { alert(e.response?.data?.message || 'Lỗi xóa') }
}

const aLoading = ref(false)
const assignments = ref<any[]>([])
const aMeta = ref({ total: 0, totalPages: 1 })
const aPg = reactive({ page: 1, limit: 10 })
const aFilters = reactive({ target_type: '', fee_id: '', trangThai: 'active' })
const showAssignModal = ref(false)
const aFormError = ref('')
const aForm = reactive({ fee_id: '' as any, target_type: '', target_id: '' as any, ngayApDung: '', mucMienGiam: 0 })

async function fetchAssignments() {
  aLoading.value = true
  try {
    const p: any = { page: aPg.page, limit: aPg.limit }
    if (aFilters.target_type) p.target_type = aFilters.target_type
    if (aFilters.fee_id) p.fee_id = aFilters.fee_id
    if (aFilters.trangThai) p.trangThai = aFilters.trangThai
    const res = await api.get('/fee_assignments', { params: p })
    assignments.value = res.data.data || []
    aMeta.value = res.data.meta || { total: 0, totalPages: 1 }
  } catch { assignments.value = [] }
  finally { aLoading.value = false }
}

function changeAPage(p: number) { aPg.page = p; fetchAssignments() }

function onTargetTypeChange() { aForm.target_id = '' }

async function submitAssign() {
  if (!aForm.fee_id) { aFormError.value = 'Vui lòng chọn biểu phí'; return }
  if (!aForm.target_type) { aFormError.value = 'Vui lòng chọn loại áp dụng'; return }
  if (aForm.target_type !== 'all_markets' && !aForm.target_id) { aFormError.value = 'Vui lòng chọn đối tượng'; return }
  if (!aForm.ngayApDung) { aFormError.value = 'Vui lòng chọn ngày áp dụng'; return }

  saving.value = true; aFormError.value = ''
  try {
    const base = { fee_id: Number(aForm.fee_id), ngayApDung: aForm.ngayApDung, mucMienGiam: aForm.mucMienGiam || 0 }

    if (aForm.target_type === 'all_markets') {
      const errors: string[] = []
      for (const z of allZones.value) {
        try {
          await api.post('/fee_assignments', { ...base, target_type: 'zone', target_id: z.zone_id })
        } catch (e: any) {
          if (!e.response?.data?.message?.includes('đã tồn tại')) errors.push(z.tenKhu)
        }
      }
      if (errors.length) aFormError.value = `Lỗi gán: ${errors.join(', ')}`
      else { showAssignModal.value = false; fetchAssignments() }

    } else if (aForm.target_type === 'market') {
      const zones = allZones.value.filter((z: any) => z.market_id == aForm.target_id)
      if (!zones.length) { aFormError.value = 'Chợ này chưa có khu vực nào'; saving.value = false; return }
      const errors: string[] = []
      for (const z of zones) {
        try {
          await api.post('/fee_assignments', { ...base, target_type: 'zone', target_id: z.zone_id })
        } catch (e: any) {
          if (!e.response?.data?.message?.includes('đã tồn tại')) errors.push(z.tenKhu)
        }
      }
      if (errors.length) aFormError.value = `Lỗi gán: ${errors.join(', ')}`
      else { showAssignModal.value = false; fetchAssignments() }

    } else {
      await api.post('/fee_assignments', { ...base, target_type: aForm.target_type, target_id: Number(aForm.target_id) })
      showAssignModal.value = false; fetchAssignments()
    }
  } catch (e: any) { aFormError.value = e.response?.data?.message || 'Lỗi khi gán' }
  finally { saving.value = false }
}

async function deactivateAssignment(a: any) {
  if (!confirm('Ngưng áp dụng biểu phí này?')) return
  try { await api.patch(`/fee_assignments/${a.assignment_id}/deactivate`); fetchAssignments() }
  catch (e: any) { alert(e.response?.data?.message || 'Lỗi') }
}

function targetTypeLabel(t: string) {
  return { kiosk: 'Kiosk', zone: 'Khu vực', kiosk_type: 'Loại Kiosk' }[t] || t
}

function fmtMoney(n: any) { return Number(n || 0).toLocaleString('vi-VN', { style: 'currency', currency: 'VND' }) }
function fmtDate(d: string) { return d ? new Date(d).toLocaleDateString('vi-VN') : '—' }
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@300;400;500;600&display=swap');
*, *::before, *::after { box-sizing: border-box; }
.page { display: flex; flex-direction: column; gap: 18px; font-family: 'Be Vietnam Pro', sans-serif; }
.page-header { display: flex; justify-content: space-between; align-items: flex-start; }
.page-title { font-size: 22px; font-weight: 600; color: #1a2e1a; margin: 0 0 4px; }
.page-sub { font-size: 13px; color: #6b836b; margin: 0; }
.tabs { display: flex; gap: 4px; background: white; border: 1px solid #e2ede2; border-radius: 12px; padding: 4px; width: fit-content; }
.tab { display: flex; align-items: center; gap: 7px; height: 36px; padding: 0 16px; background: none; border: none; border-radius: 9px; font-size: 13px; font-family: 'Be Vietnam Pro', sans-serif; color: #6b836b; cursor: pointer; transition: all .15s; white-space: nowrap; }
.tab:hover { background: #f0f7f0; color: #2d6e2d; }
.tab--active { background: #CCFF66; color: #1a3d00; font-weight: 600; }
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
.data-table tbody tr:hover td { background: #fafcfa; }
.data-table tbody tr:last-child td { border-bottom: none; }
.cell-main { font-size: 13.5px; font-weight: 500; color: #1a2e1a; }
.cell-sub { font-size: 12.5px; color: #6b836b; }
.cell-money { font-size: 13px; font-weight: 500; color: #1a2e1a; white-space: nowrap; }
.cell-date { font-size: 12.5px; color: #6b836b; white-space: nowrap; }
.badge { display: inline-flex; align-items: center; padding: 3px 9px; border-radius: 20px; font-size: 11.5px; font-weight: 500; }
.badge--green  { background: #eef7ee; color: #2d6e2d; }
.badge--red    { background: #fef2f2; color: #dc2626; }
.badge--blue   { background: #eff6ff; color: #1d4ed8; }
.badge--purple { background: #f5f3ff; color: #6d28d9; }
.badge--gray   { background: #f4f4f4; color: #6b7280; }
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
.modal { background: white; border-radius: 16px; width: 100%; max-width: 500px; max-height: 90vh; overflow-y: auto; box-shadow: 0 20px 60px rgba(0,0,0,0.15); }
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
.error-banner { background: #fef2f2; border: 1px solid #fecaca; border-radius: 9px; padding: 10px 14px; color: #b91c1c; font-size: 13px; }
.info-note { display: flex; align-items: flex-start; gap: 8px; background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 10px 13px; font-size: 12.5px; color: #1e40af; line-height: 1.55; }
.info-note svg { flex-shrink: 0; margin-top: 1px; }
.spin { width: 14px; height: 14px; border: 2px solid rgba(255,255,255,.35); border-top-color: white; border-radius: 50%; animation: spin .65s linear infinite; display: inline-block; }
@keyframes spin { to { transform: rotate(360deg); } }
</style>