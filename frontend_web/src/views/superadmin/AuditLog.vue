<template>
  <div class="audit-page">
    <div class="page-header">
      <div>
        <h1 class="page-title">Audit Log</h1>
        <p class="page-sub">Lịch sử mọi thao tác trong hệ thống</p>
      </div>
      <button class="btn-outline" @click="fetchLogs">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
        Làm mới
      </button>
    </div>

    <div class="filter-bar">
      <div class="search-wrap">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <input v-model="filters.keyword" placeholder="Tìm theo action, email..." @input="debouncedFetch" />
      </div>
      <input type="date" v-model="filters.start_date" @change="fetchLogs" class="date-input" />
      <input type="date" v-model="filters.end_date" @change="fetchLogs" class="date-input" />
    </div>

    <div class="table-panel">
      <div class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>Thời gian</th>
              <th>Action</th>
              <th>Entity</th>
              <th>Người thực hiện</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading"><td colspan="5"><div class="loading-bar"></div></td></tr>
            <tr v-for="log in logs" :key="log.log_id">
              <td class="cell-date">{{ fmtDatetime(log.thoiGianThucHien) }}</td>
              <td>
                <span class="action-badge" :class="actionClass(log.hanhDong)">{{ log.hanhDong }}</span>
              </td>
              <td>
                <span class="entity-chip">{{ log.entity_type }}</span>
                <span class="cell-sub">{{ log.entity_id }}</span>
              </td>
              <td>
                <div class="cell-main">{{ log.performer_name || log.email || '—' }}</div>
                <div class="cell-sub">{{ log.performer_role || '' }}</div>
              </td>
              <td>
                <button class="icon-btn" @click="viewDetail(log)" title="Xem chi tiết">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                </button>
              </td>
            </tr>
            <tr v-if="!loading && !logs.length">
              <td colspan="5" class="empty-row">Không có log nào</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div class="pagination" v-if="meta.totalPages > 1">
      <button :disabled="filters.page <= 1" @click="changePage(filters.page - 1)">← Trước</button>
      <span>Trang {{ filters.page }} / {{ meta.totalPages }}</span>
      <button :disabled="filters.page >= meta.totalPages" @click="changePage(filters.page + 1)">Tiếp →</button>
    </div>

    <Teleport to="body">
      <div v-if="detailModal" class="modal-overlay" @click.self="detailModal = false">
        <div class="modal">
          <div class="modal-header">
            <h3>Chi tiết Log #{{ selectedLog?.log_id }}</h3>
            <button class="modal-close" @click="detailModal = false"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
          </div>
          <div class="modal-body" v-if="selectedLog">
            <div class="detail-row"><span class="detail-label">Action</span><span class="action-badge" :class="actionClass(selectedLog.hanhDong)">{{ selectedLog.hanhDong }}</span></div>
            <div class="detail-row"><span class="detail-label">Entity</span><span>{{ selectedLog.entity_type }} #{{ selectedLog.entity_id }}</span></div>
            <div class="detail-row"><span class="detail-label">Người thực hiện</span><span>{{ selectedLog.performer_name || selectedLog.email || '—' }} <span style="color:#94a894;font-size:12px">{{ selectedLog.performer_role ? "(" + selectedLog.performer_role + ")" : "" }}</span></span></div>
            <div class="detail-row"><span class="detail-label">Thời gian</span><span>{{ fmtDatetime(selectedLog.thoiGianThucHien) }}</span></div>
            <div v-if="selectedLog.giaTriCu" class="detail-section">
              <div class="detail-section-title">Giá trị cũ</div>
              <pre class="json-block">{{ JSON.stringify(selectedLog.giaTriCu, null, 2) }}</pre>
            </div>
            <div v-if="selectedLog.giaTriMoi" class="detail-section">
              <div class="detail-section-title">Giá trị mới</div>
              <pre class="json-block">{{ JSON.stringify(selectedLog.giaTriMoi, null, 2) }}</pre>
            </div>
          </div>
        </div>
      </div>
    </Teleport>

  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import api from '@/api/axios'

const loading = ref(true)
const logs = ref<any[]>([])
const meta = ref({ total: 0, totalPages: 1 })
const detailModal = ref(false)
const selectedLog = ref<any>(null)
const filters = reactive({ keyword: '', start_date: '', end_date: '', page: 1, limit: 15 })

let debounceTimer: any
function debouncedFetch() { clearTimeout(debounceTimer); debounceTimer = setTimeout(fetchLogs, 400) }

onMounted(fetchLogs)

async function fetchLogs() {
  loading.value = true
  try {
    const params = new URLSearchParams(Object.fromEntries(Object.entries(filters).filter(([, v]) => v !== '').map(([k, v]) => [k, String(v)])))
    const res = await api.get(`/audit_logs/superadmin?${params}`)
    logs.value = res.data.data || []
    meta.value = res.data.meta || { total: 0, totalPages: 1 }
  } catch {}
  finally { loading.value = false }
}

function changePage(p: number) { filters.page = p; fetchLogs() }
function viewDetail(log: any) { selectedLog.value = log; detailModal.value = true }

function actionClass(action: string) {
  if (!action) return 'action--gray'
  if (action.includes('CREATE')) return 'action--green'
  if (action.includes('DELETE') || action.includes('INACTIVE') || action.includes('KHOA')) return 'action--red'
  if (action.includes('UPDATE') || action.includes('CHANGE')) return 'action--blue'
  if (action.includes('THANH_TOAN')) return 'action--purple'
  return 'action--gray'
}

function fmtDatetime(d: string) {
  if (!d) return '—'
  return new Date(d).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' })
}
</script>

<style scoped>
.audit-page { display: flex; flex-direction: column; gap: 20px; }
.page-header { display: flex; justify-content: space-between; align-items: flex-start; }
.page-title { font-size: 22px; font-weight: 600; color: #1a2e1a; margin: 0 0 4px; letter-spacing: -0.3px; }
.page-sub { font-size: 13.5px; color: #6b836b; margin: 0; }

.filter-bar { display: flex; gap: 10px; flex-wrap: wrap; }
.search-wrap { flex: 1; min-width: 200px; max-width: 360px; position: relative; display: flex; align-items: center; }
.search-wrap svg { position: absolute; left: 12px; color: #94a894; pointer-events: none; }
.search-wrap input { width: 100%; height: 40px; padding: 0 12px 0 36px; border: 1.5px solid #d4e4d4; border-radius: 10px; font-size: 13.5px; font-family: 'Be Vietnam Pro', sans-serif; color: #1a2e1a; background: white; outline: none; box-sizing: border-box; }
.search-wrap input:focus { border-color: #3d8c3d; }
.date-input { height: 40px; padding: 0 12px; border: 1.5px solid #d4e4d4; border-radius: 10px; font-size: 13.5px; font-family: 'Be Vietnam Pro', sans-serif; color: #1a2e1a; background: white; outline: none; }

.table-panel { background: white; border: 1px solid #e2ede2; border-radius: 14px; overflow: hidden; }
.table-wrap { overflow-x: auto; }
.data-table { width: 100%; border-collapse: collapse; }
.data-table th { padding: 12px 16px; font-size: 11.5px; font-weight: 600; color: #94a894; text-transform: uppercase; letter-spacing: 0.05em; text-align: left; background: #fafcfa; border-bottom: 1px solid #f0f5f0; white-space: nowrap; }
.data-table td { padding: 12px 16px; border-bottom: 1px solid #f7faf7; vertical-align: middle; }
.data-table tbody tr:last-child td { border-bottom: none; }
.data-table tbody tr:hover { background: #fafcfa; }

.cell-main { font-size: 13px; font-weight: 500; color: #1a2e1a; }
.cell-sub { font-size: 11.5px; color: #94a894; margin-top: 2px; }
.cell-date { font-size: 12px; color: #6b836b; white-space: nowrap; }

.action-badge { display: inline-flex; padding: 3px 8px; border-radius: 6px; font-size: 11.5px; font-weight: 600; font-family: 'Be Vietnam Pro', monospace; white-space: nowrap; }
.action--green { background: #eef7ee; color: #2d6e2d; }
.action--red { background: #fef2f2; color: #dc2626; }
.action--blue { background: #eff6ff; color: #1d4ed8; }
.action--purple { background: #f5f3ff; color: #6d28d9; }
.action--gray { background: #f4f4f4; color: #6b7280; }

.entity-chip { display: inline-flex; padding: 2px 6px; background: #f0f5f0; color: #4a654a; border-radius: 5px; font-size: 11px; font-weight: 500; margin-right: 6px; }

.icon-btn { width: 30px; height: 30px; background: none; border: 1px solid #e2ede2; border-radius: 7px; display: flex; align-items: center; justify-content: center; cursor: pointer; color: #4a654a; transition: all 0.15s; }
.icon-btn:hover { background: #f0f7f0; }
.empty-row { text-align: center; padding: 40px !important; color: #94a894; font-size: 13px; }

.loading-bar { height: 3px; background: linear-gradient(90deg, #eef7ee, #3d8c3d, #eef7ee); background-size: 200%; animation: shimmer 1.5s infinite; border-radius: 2px; }
@keyframes shimmer { to { background-position: -200% center; } }

.pagination { display: flex; align-items: center; gap: 12px; justify-content: center; }
.pagination button { height: 36px; padding: 0 16px; background: white; border: 1px solid #e2ede2; border-radius: 8px; cursor: pointer; font-size: 13px; }
.pagination button:hover:not(:disabled) { background: #f0f7f0; }
.pagination button:disabled { opacity: 0.4; cursor: not-allowed; }
.pagination span { font-size: 13px; color: #6b836b; }

.btn-outline { display: inline-flex; align-items: center; gap: 7px; height: 38px; padding: 0 16px; background: white; border: 1.5px solid #d4e4d4; border-radius: 10px; color: #2d4a2d; font-size: 13px; font-family: 'Be Vietnam Pro', sans-serif; cursor: pointer; transition: background 0.15s; }
.btn-outline:hover { background: #f0f7f0; }

.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 1rem; }
.modal { background: white; border-radius: 16px; width: 100%; max-width: 560px; max-height: 88vh; overflow-y: auto; box-shadow: 0 20px 60px rgba(0,0,0,0.15); }
.modal-header { display: flex; justify-content: space-between; align-items: center; padding: 20px 24px 16px; border-bottom: 1px solid #f0f5f0; }
.modal-header h3 { font-size: 16px; font-weight: 600; color: #1a2e1a; margin: 0; }
.modal-close { background: none; border: none; color: #94a894; cursor: pointer; display: flex; align-items: center; padding: 4px; border-radius: 6px; }
.modal-close:hover { background: #f0f5f0; }
.modal-body { padding: 20px 24px; display: flex; flex-direction: column; gap: 12px; }

.detail-row { display: flex; align-items: center; gap: 12px; font-size: 13.5px; }
.detail-label { min-width: 140px; font-size: 12px; font-weight: 600; color: #94a894; text-transform: uppercase; letter-spacing: 0.05em; }
.detail-section { margin-top: 8px; }
.detail-section-title { font-size: 12px; font-weight: 600; color: #94a894; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 6px; }
.json-block { background: #f7faf7; border: 1px solid #e2ede2; border-radius: 8px; padding: 12px; font-size: 12px; font-family: monospace; color: #2d4a2d; overflow-x: auto; white-space: pre-wrap; max-height: 200px; }
</style>