<template>
  <div class="notif-page">
    <div class="page-header">
      <div>
        <h1 class="page-title">Thông báo</h1>
      </div>
      <button class="btn-primary" @click="openCreate">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        Tạo thông báo
      </button>
    </div>

    <div class="notif-layout">

      <div class="notif-list-panel">
        <div class="panel-head">
          <span class="panel-title">Danh sách</span>
          <span class="unread-chip" v-if="unreadCount > 0">{{ unreadCount }} chưa đọc</span>
        </div>

        <div v-if="loading" class="sk-list">
          <div v-for="i in 6" :key="i" class="sk-notif"></div>
        </div>

        <div v-else class="notif-items">
          <div
            v-for="n in notifications" :key="n.notification_id"
            class="notif-item"
            :class="{ 'notif-item--unread': !n.is_read, 'notif-item--active': selected?.notification_id === n.notification_id }"
            @click="openNotif(n)"
          >
            <div class="notif-item-dot" v-if="!n.is_read"></div>
            <div class="notif-item-body">
              <div class="notif-item-header">
                <div class="notif-item-title">{{ n.title }}</div>
                <span class="target-chip" :class="targetChipClass(n)">{{ targetLabel(n) }}</span>
              </div>
              <div class="notif-item-preview">{{ truncate(n.content) }}</div>
              <div class="notif-item-time">{{ dt(n.created_at) }}</div>
            </div>
          </div>
          <div v-if="!notifications.length" class="empty">Không có thông báo nào</div>
        </div>

        <div class="pagination-sm" v-if="meta.totalPages > 1">
          <button :disabled="page <= 1" @click="page--; fetchNotifs()">←</button>
          <span>{{ page }} / {{ meta.totalPages }}</span>
          <button :disabled="page >= meta.totalPages" @click="page++; fetchNotifs()">→</button>
        </div>
      </div>

      <div class="notif-detail-panel" v-if="selected">
        <div class="detail-head">
          <div class="detail-head-top">
            <h2 class="detail-title">{{ selected.title }}</h2>
            <span class="target-chip" :class="targetChipClass(selected)">{{ targetLabel(selected) }}</span>
          </div>
          <div class="detail-meta">{{ dt(selected.created_at) }}</div>
        </div>
        <div class="detail-body"><p>{{ selected.content }}</p></div>

        <div class="detail-actions" v-if="!selected.is_read">
          <button class="btn-outline" @click="markRead(selected)">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
            Đánh dấu đã đọc
          </button>
        </div>
        <div class="read-badge" v-else>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
          Đã đọc
        </div>
      </div>

      <div class="notif-detail-panel notif-detail-empty" v-else>
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#b0c4b0" stroke-width="1.5"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
        <p>Chọn thông báo để xem chi tiết</p>
      </div>
    </div>

    <Teleport to="body">
      <div v-if="showCreate" class="modal-overlay" @click.self="showCreate = false">
        <div class="modal">
          <div class="modal-head">
            <h3>Tạo thông báo mới</h3>
            <button class="modal-close" @click="showCreate = false">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
          <div class="modal-body">
            <div class="field">
              <label>Tiêu đề <span class="req">*</span></label>
              <input v-model="form.title" placeholder="Tiêu đề thông báo..." />
            </div>
            <div class="field">
              <label>Nội dung <span class="req">*</span></label>
              <textarea v-model="form.content" rows="4" placeholder="Nội dung thông báo..."></textarea>
            </div>

            <div class="field">
              <label>Gửi đến</label>
              <select v-model="form.target_type" @change="onTargetTypeChange">
                <option value="tenant">Toàn bộ (tất cả chợ)</option>
                <option value="market">Theo chợ</option>
                <option value="zone">Theo khu vực</option>
                <option value="role">Theo vai trò</option>
              </select>
            </div>

            <div class="field" v-if="form.target_type === 'market' || form.target_type === 'zone'">
              <label>Chọn chợ <span class="req">*</span></label>
              <select v-model="form.market_id" @change="loadZones">
                <option :value="null">-- Chọn chợ --</option>
                <option v-for="m in markets" :key="m.market_id" :value="m.market_id">{{ m.tenCho }}</option>
              </select>
            </div>

            <div class="field" v-if="form.target_type === 'zone' && zones.length">
              <label>Chọn khu vực <span class="req">*</span></label>
              <select v-model="form.zone_id">
                <option :value="null">-- Chọn khu --</option>
                <option v-for="z in zones" :key="z.zone_id" :value="z.zone_id">{{ z.tenKhu }}</option>
              </select>
            </div>

            <div class="field" v-if="form.target_type === 'role'">
              <label>Vai trò nhận thông báo</label>
              <select v-model="form.target_role">
                <option value="collector">Thu ngân</option>
                <option value="merchant">Tiểu thương</option>
              </select>
            </div>

            <div class="field">
              <label>Hết hạn <span style="color:#94a894;font-weight:400">(tuỳ chọn)</span></label>
              <input v-model="form.expires_at" type="datetime-local" />
            </div>

            <div class="error-banner" v-if="formError">{{ formError }}</div>
          </div>
          <div class="modal-foot">
            <button class="btn-ghost" @click="showCreate = false">Hủy</button>
            <button class="btn-primary" @click="createNotif" :disabled="saving">
              <span v-if="saving" class="spin"></span>
              {{ saving ? 'Đang gửi...' : 'Tạo thông báo' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import api from '@/api/axios'

const loading   = ref(true)
const saving    = ref(false)
const showCreate = ref(false)
const formError = ref('')
const notifications = ref<any[]>([])
const selected  = ref<any>(null)
const page      = ref(1)
const meta      = ref({ total: 0, totalPages: 1 })
const unreadCount = ref(0)
const markets   = ref<any[]>([])
const zones     = ref<any[]>([])

const form = reactive({
  title:       '',
  content:     '',
  target_type: 'tenant' as string,
  market_id:   null as number | null,
  zone_id:     null as number | null,
  target_role: 'collector' as string,
  expires_at:  '',
})

onMounted(async () => {
  await Promise.all([
    fetchNotifs(),
    fetchUnreadCount(),
    api.get('/market', { params: { limit: 200 } })
      .then(r => markets.value = r.data.data || [])
      .catch(() => {}),
  ])
})

async function fetchNotifs() {
  loading.value = true
  try {
    const res = await api.get('/notifications', { params: { page: page.value, limit: 15 } })
    notifications.value = res.data.data || []
    meta.value = res.data.meta || { total: 0, totalPages: 1 }
  } catch {}
  finally { loading.value = false }
}

async function fetchUnreadCount() {
  try {
    const res = await api.get('/notifications/unread_count')
    unreadCount.value = res.data.unread_count || 0
  } catch {}
}

async function loadZones() {
  form.zone_id = null
  zones.value = []
  if (!form.market_id) return
  try {
    const res = await api.get('/zone', { params: { market_id: form.market_id, limit: 200 } })
    zones.value = res.data.data || []
  } catch {}
}

function onTargetTypeChange() {
  form.market_id = null
  form.zone_id   = null
  zones.value    = []
}

function openCreate() {
  Object.assign(form, {
    title: '', content: '', target_type: 'tenant',
    market_id: null, zone_id: null, target_role: 'collector', expires_at: '',
  })
  zones.value  = []
  formError.value = ''
  showCreate.value = true
}

async function openNotif(n: any) {
  selected.value = n
  try {
    const res = await api.get(`/notifications/${n.notification_id}`)
    selected.value = { ...n, ...res.data }
    const item = notifications.value.find(x => x.notification_id === n.notification_id)
    if (item && !item.is_read) {
      item.is_read = 1
      unreadCount.value = Math.max(0, unreadCount.value - 1)
    }
  } catch {}
}

async function markRead(n: any) {
  try {
    await api.post(`/notifications/${n.notification_id}/read`)
    n.is_read = 1
    if (selected.value?.notification_id === n.notification_id) selected.value.is_read = 1
    const item = notifications.value.find(x => x.notification_id === n.notification_id)
    if (item) item.is_read = 1
    unreadCount.value = Math.max(0, unreadCount.value - 1)
  } catch {}
}

async function createNotif() {
  if (!form.title.trim() || !form.content.trim()) {
    formError.value = 'Vui lòng điền tiêu đề và nội dung'; return
  }
  if (form.target_type === 'market' && !form.market_id) {
    formError.value = 'Vui lòng chọn chợ'; return
  }
  if (form.target_type === 'zone' && !form.zone_id) {
    formError.value = 'Vui lòng chọn khu vực'; return
  }

  saving.value = true; formError.value = ''
  try {
    const payload: any = {
      title:    form.title.trim(),
      content:  form.content.trim(),
      expires_at: form.expires_at || null,
    }

    if (form.target_type === 'market' && form.market_id) {
      payload.market_id = form.market_id
    } else if (form.target_type === 'zone' && form.zone_id) {
      payload.market_id = form.market_id
      payload.zone_id   = form.zone_id
    } else if (form.target_type === 'role') {
      payload.target_role = form.target_role
    }

    await api.post('/notifications', payload)
    showCreate.value = false
    page.value = 1
    fetchNotifs()
  } catch (e: any) {
    formError.value = e.response?.data?.message || 'Lỗi tạo thông báo'
  } finally { saving.value = false }
}

function targetChipClass(n: any) {
  if (n.zone_id)        return 'target-zone'
  if (n.market_id)      return 'target-market'
  if (n.target_role)    return 'target-role'
  if (n.type === 'system') return 'target-all'
  return 'target-tenant'
}

function targetLabel(n: any) {
  if (n.zone_id)        return 'Khu vực'
  if (n.market_id)      return 'Chợ'
  if (n.target_role)    return n.target_role === 'collector' ? 'Thu ngân' : 'Tiểu thương'
  if (n.type === 'system') return 'Toàn hệ thống'
  return 'Toàn bộ'
}

const truncate = (s: string) => s?.length > 80 ? s.slice(0, 80) + '...' : (s || '')
const dt = (d: string) => d ? new Date(d).toLocaleString('vi-VN', {
  hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric'
}) : '—'
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@300;400;500;600&display=swap');
*, *::before, *::after { box-sizing: border-box; }
.notif-page { display: flex; flex-direction: column; gap: 20px; font-family: 'Be Vietnam Pro', sans-serif; }
.page-header { display: flex; justify-content: space-between; align-items: flex-start; }
.page-title { font-size: 22px; font-weight: 600; color: #1a2e1a; margin: 0 0 4px; }
.page-sub { font-size: 13px; color: #6b836b; margin: 0; }

.notif-layout { display: grid; grid-template-columns: 360px 1fr; gap: 16px; min-height: 500px; }

.notif-list-panel { background: white; border: 1px solid #e2ede2; border-radius: 14px; overflow: hidden; display: flex; flex-direction: column; }
.panel-head { display: flex; align-items: center; justify-content: space-between; padding: 14px 16px; border-bottom: 1px solid #f0f5f0; }
.panel-title { font-size: 13.5px; font-weight: 600; color: #1a2e1a; }
.unread-chip { font-size: 11.5px; font-weight: 600; background: #eef7ee; color: #2d6e2d; padding: 3px 8px; border-radius: 20px; }

.sk-list { padding: 10px; display: flex; flex-direction: column; gap: 8px; }
.sk-notif { height: 64px; background: #f0f5f0; border-radius: 10px; animation: pulse 1.2s infinite; }
@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.45} }

.notif-items { flex: 1; overflow-y: auto; }
.notif-item { display: flex; align-items: flex-start; gap: 10px; padding: 12px 14px; border-bottom: 1px solid #f7faf7; cursor: pointer; transition: background 0.15s; }
.notif-item:last-child { border-bottom: none; }
.notif-item:hover { background: #fafcfa; }
.notif-item--active { background: #f0f7f0 !important; }
.notif-item--unread { background: #fafef9; }
.notif-item-dot { width: 7px; height: 7px; background: #3d8c3d; border-radius: 50%; margin-top: 6px; flex-shrink: 0; }
.notif-item-body { flex: 1; min-width: 0; }
.notif-item-header { display: flex; align-items: center; gap: 6px; margin-bottom: 3px; }
.notif-item-title { font-size: 13px; font-weight: 500; color: #1a2e1a; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; flex: 1; }
.notif-item-preview { font-size: 12px; color: #6b836b; line-height: 1.4; margin-bottom: 4px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.notif-item-time { font-size: 11px; color: #b0c4b0; }

.target-chip { font-size: 10px; font-weight: 600; padding: 2px 6px; border-radius: 10px; white-space: nowrap; flex-shrink: 0; }
.target-all    { background: #fef3c7; color: #92400e; }
.target-tenant { background: #eff6ff; color: #1d4ed8; }
.target-market { background: #f0fdf4; color: #166534; }
.target-zone   { background: #f5f3ff; color: #6d28d9; }
.target-role   { background: #fff1f2; color: #be123c; }

.empty { text-align: center; padding: 48px 16px; color: #94a894; font-size: 13px; }
.pagination-sm { display: flex; align-items: center; justify-content: center; gap: 10px; padding: 10px; border-top: 1px solid #f0f5f0; }
.pagination-sm button { width: 28px; height: 28px; background: none; border: 1px solid #e2ede2; border-radius: 7px; cursor: pointer; font-size: 12px; }
.pagination-sm button:disabled { opacity: 0.4; cursor: not-allowed; }
.pagination-sm span { font-size: 12px; color: #6b836b; }

.notif-detail-panel { background: white; border: 1px solid #e2ede2; border-radius: 14px; padding: 24px; display: flex; flex-direction: column; }
.notif-detail-empty { align-items: center; justify-content: center; gap: 12px; color: #94a894; font-size: 13.5px; }
.detail-head { margin-bottom: 16px; padding-bottom: 14px; border-bottom: 1px solid #f0f5f0; }
.detail-head-top { display: flex; align-items: flex-start; gap: 10px; margin-bottom: 6px; }
.detail-title { font-size: 18px; font-weight: 600; color: #1a2e1a; margin: 0; flex: 1; }
.detail-meta { font-size: 12.5px; color: #94a894; }
.detail-body p { font-size: 14px; color: #2d4a2d; line-height: 1.7; margin: 0; white-space: pre-wrap; }
.detail-actions { margin-top: 20px; }
.read-badge { display: inline-flex; align-items: center; gap: 6px; margin-top: 20px; font-size: 12.5px; color: #3d8c3d; background: #eef7ee; padding: 5px 12px; border-radius: 20px; }

.read-stats { margin-top: 16px; padding: 14px; background: #f7faf7; border-radius: 10px; border: 1px solid #e2ede2; display: flex; flex-direction: column; gap: 8px; }
.stat-item { display: flex; align-items: center; gap: 7px; font-size: 13px; color: #4a654a; }
.stat-item--read { color: #2d6e2d; }
.stat-item strong { color: #1a2e1a; }
.stat-bar { height: 6px; background: #e2ede2; border-radius: 3px; overflow: hidden; }
.stat-bar-fill { height: 100%; background: #3d8c3d; border-radius: 3px; transition: width 0.4s; }
.stat-pct { font-size: 12px; color: #6b836b; text-align: right; }

.btn-primary { display: inline-flex; align-items: center; gap: 7px; height: 40px; padding: 0 18px; background: #3d8c3d; border: none; border-radius: 10px; color: white; font-size: 13.5px; font-weight: 500; font-family: 'Be Vietnam Pro', sans-serif; cursor: pointer; transition: background .15s; }
.btn-primary:hover:not(:disabled) { background: #2d6e2d; }
.btn-primary:disabled { opacity: 0.55; cursor: not-allowed; }
.btn-outline { display: inline-flex; align-items: center; gap: 7px; height: 38px; padding: 0 16px; background: white; border: 1.5px solid #d4e4d4; border-radius: 9px; color: #2d4a2d; font-size: 13px; font-family: 'Be Vietnam Pro', sans-serif; cursor: pointer; }
.btn-outline:hover { background: #f0f7f0; }
.btn-ghost { height: 40px; padding: 0 18px; background: none; border: 1px solid #e2ede2; border-radius: 10px; color: #4a654a; font-size: 13.5px; font-family: 'Be Vietnam Pro', sans-serif; cursor: pointer; }
.btn-ghost:hover { background: #f7faf7; }

.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 1rem; }
.modal { background: white; border-radius: 16px; width: 100%; max-width: 500px; max-height: 90vh; overflow-y: auto; box-shadow: 0 20px 60px rgba(0,0,0,0.15); }
.modal-head { display: flex; justify-content: space-between; align-items: center; padding: 18px 22px 14px; border-bottom: 1px solid #f0f5f0; }
.modal-head h3 { font-size: 15px; font-weight: 600; color: #1a2e1a; margin: 0; }
.modal-close { background: none; border: none; color: #94a894; cursor: pointer; display: flex; align-items: center; padding: 4px; border-radius: 6px; }
.modal-close:hover { background: #f0f5f0; }
.modal-body { padding: 18px 22px; display: flex; flex-direction: column; gap: 12px; }
.modal-foot { display: flex; justify-content: flex-end; gap: 10px; padding: 14px 22px; border-top: 1px solid #f0f5f0; }

.field { display: flex; flex-direction: column; gap: 5px; }
.field label { font-size: 12.5px; font-weight: 500; color: #3a4f3a; }
.req { color: #dc2626; }
.field input, .field textarea, .field select { width: 100%; padding: 9px 12px; border: 1.5px solid #d4e4d4; border-radius: 10px; font-size: 13.5px; font-family: 'Be Vietnam Pro', sans-serif; color: #1a2e1a; background: #fbfdfb; outline: none; resize: vertical; }
.field input:focus, .field textarea:focus, .field select:focus { border-color: #3d8c3d; background: white; }
.error-banner { background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 10px 12px; color: #b91c1c; font-size: 13px; }
.spin { width: 14px; height: 14px; border: 2px solid rgba(255,255,255,.35); border-top-color: white; border-radius: 50%; animation: spin .65s linear infinite; display: inline-block; }
@keyframes spin { to { transform: rotate(360deg); } }
@media (max-width: 900px) { .notif-layout { grid-template-columns: 1fr; } }
</style>