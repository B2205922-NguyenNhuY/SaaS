<template>
  <div class="profile-page">
    <div class="page-header">
      <div>
        <h1 class="page-title">Profile</h1>
        <p class="page-sub">Thông tin tài khoản quản trị của bạn</p>
      </div>
    </div>

    <div class="profile-grid">

      <div class="card profile-card">
        <div class="avatar-section">
          <div class="avatar-lg">{{ initials }}</div>
          <div>
            <div class="profile-name">{{ profileForm.hoTen || authStore.user?.hoTen }}</div>
            <div class="profile-email">{{ authStore.user?.email }}</div>
            <span class="role-badge">Tenant Admin</span>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-head">
          <h2 class="card-title">Thông tin cá nhân</h2>
        </div>
        <div class="card-body">
          <div v-if="profileSuccess" class="success-banner">Cập nhật thành công!</div>
          <div v-if="profileError" class="error-banner">{{ profileError }}</div>

          <div class="form-row">
            <div class="field">
              <label>Họ và tên <span class="req">*</span></label>
              <input v-model="profileForm.hoTen" placeholder="Nguyễn Văn A" />
            </div>
            <div class="field">
              <label>Email <span class="req">*</span></label>
              <input v-model="profileForm.email" placeholder="email@example.com" />
            </div>
          </div>

          <div class="field">
            <label>Số điện thoại <span class="req">*</span></label>
            <input v-model="profileForm.soDienThoai" placeholder="0901234567" />
          </div>

          <div class="form-actions">
            <button class="btn-primary" @click="updateUserInfo" :disabled="savingUser">
              <span v-if="savingUser" class="spin"></span>
              {{ savingUser ? 'Đang lưu...' : 'Cập nhật thông tin cá nhân' }}
            </button>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-head">
          <h2 class="card-title">Thông tin Ban Quản Lý</h2>
        </div>
        <div class="card-body">
          <div v-if="tenantSuccess" class="success-banner">Cập nhật thành công!</div>
          <div v-if="tenantError" class="error-banner">{{ tenantError }}</div>

          <div class="form-row">
            <div class="field">
              <label>Tên Ban Quản Lý <span class="req">*</span></label>
              <input v-model="tenantForm.tenBanQuanLy" placeholder="Chợ Bến Thành" />
            </div>
            <div class="field">
              <label>Mã số thuế <span class="req">*</span></label>
              <input v-model="tenantForm.maSoThue" placeholder="0101234567" />
            </div>
          </div>

          <div class="field">
            <label>Địa chỉ <span class="req">*</span></label>
            <input v-model="tenantForm.diachi" placeholder="123 Lê Lợi, Q1, TP.HCM" />
          </div>

          <div class="form-row">
            <div class="field">
              <label>Tên công ty</label>
              <input v-model="tenantForm.tenCongTy" placeholder="Công ty TNHH Quản lý Chợ" />
            </div>
            <div class="field">
              <label>Người đại diện</label>
              <input v-model="tenantForm.nguoiDaiDien" placeholder="Nguyễn Văn A" />
            </div>
          </div>

          <div class="field">
            <label>Chức vụ</label>
            <input v-model="tenantForm.chucVu" placeholder="Giám đốc" />
          </div>

          <div class="form-actions">
            <button class="btn-primary" @click="updateTenantInfo" :disabled="savingTenant">
              <span v-if="savingTenant" class="spin"></span>
              {{ savingTenant ? 'Đang lưu...' : 'Cập nhật thông tin BQL' }}
            </button>
          </div>
        </div>
      </div>

      <div class="card" style="grid-column: 1 / -1">
        <div class="card-head">
          <h2 class="card-title">Đổi mật khẩu</h2>
        </div>
        <div class="card-body">
          <div v-if="pwdSuccess" class="success-banner">Đổi mật khẩu thành công!</div>
          <div v-if="pwdError" class="error-banner">{{ pwdError }}</div>

          <div class="pwd-row">
            <div class="field">
              <label>Mật khẩu mới <span class="req">*</span></label>
              <div class="input-wrap">
                <input :type="showPwd ? 'text' : 'password'" v-model="pwdForm.newPassword" placeholder="••••••••" />
                <button type="button" class="eye-btn" @click="showPwd = !showPwd">
                  <svg v-if="!showPwd" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  <svg v-else width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                </button>
              </div>
            </div>

            <div class="field">
              <label>Xác nhận mật khẩu <span class="req">*</span></label>
              <div class="input-wrap">
                <input :type="showConfirm ? 'text' : 'password'" v-model="pwdForm.confirmPassword" placeholder="••••••••" />
                <button type="button" class="eye-btn" @click="showConfirm = !showConfirm">
                  <svg v-if="!showConfirm" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  <svg v-else width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                </button>
              </div>
            </div>
          </div>

          <div class="pwd-strength" v-if="pwdForm.newPassword">
            <div class="strength-bars">
              <div v-for="i in 4" :key="i" class="strength-bar"
                :class="{ active: pwdStrength >= i, [`s${pwdStrength}`]: true }">
              </div>
            </div>
            <span class="strength-label">{{ strengthLabel }}</span>
          </div>

          <div class="form-actions">
            <button class="btn-primary" @click="changePassword" :disabled="savingPwd">
              <span v-if="savingPwd" class="spin"></span>
              {{ savingPwd ? 'Đang đổi...' : 'Đổi mật khẩu' }}
            </button>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import api from '@/api/axios'

const authStore = useAuthStore()
const showPwd     = ref(false)
const showConfirm = ref(false)

const savingUser   = ref(false)
const savingTenant = ref(false)
const savingPwd    = ref(false)

const profileSuccess = ref(false)
const profileError   = ref('')
const tenantSuccess  = ref(false)
const tenantError    = ref('')
const pwdSuccess     = ref(false)
const pwdError       = ref('')

const profileForm = reactive({
  hoTen:       '',
  email:       '',
  soDienThoai: '',
})

const tenantForm = reactive({
  tenBanQuanLy: '',
  diachi:       '',
  maSoThue:     '',
  tenCongTy:    '',
  nguoiDaiDien: '',
  chucVu:       '',
  email:        '',
  soDienThoai:  '',
})

const pwdForm = reactive({ newPassword: '', confirmPassword: '' })

const initials = computed(() => {
  const n = authStore.user?.hoTen || ''
  return n.split(' ').map((w: string) => w[0]).slice(-2).join('').toUpperCase() || 'TA'
})

const pwdStrength = computed(() => {
  const p = pwdForm.newPassword
  if (!p) return 0
  let s = 0
  if (p.length >= 8) s++
  if (/[A-Z]/.test(p)) s++
  if (/[0-9]/.test(p)) s++
  if (/[^A-Za-z0-9]/.test(p)) s++
  return s
})

const strengthLabel = computed(() => {
  return ['', 'Yếu', 'Trung bình', 'Khá', 'Mạnh'][pwdStrength.value]
})

onMounted(async () => {
  try {
    const tenantId = authStore.user?.tenant_id
    if (!tenantId) throw new Error('Không tìm thấy tenant_id')

    const res = await api.get(`/tenant/${tenantId}`)
    const t = res.data

    profileForm.hoTen       = authStore.user?.hoTen       || ''
    profileForm.email       = authStore.user?.email        || ''
    profileForm.soDienThoai = authStore.user?.soDienThoai  || ''

    tenantForm.tenBanQuanLy = t.tenBanQuanLy  || ''
    tenantForm.diachi       = t.diaChi         || ''
    tenantForm.maSoThue     = t.maSoThue       || ''
    tenantForm.tenCongTy    = t.tenCongTy      || ''
    tenantForm.nguoiDaiDien = t.nguoiDaiDien   || ''
    tenantForm.chucVu       = t.chucVu         || ''
    tenantForm.email        = t.email          || ''
    tenantForm.soDienThoai  = t.soDienThoai    || ''

  } catch (e: any) {
    profileError.value = e.response?.data?.message || 'Không thể tải thông tin'
  }
})

async function updateUserInfo() {
  if (!profileForm.hoTen || !profileForm.email || !profileForm.soDienThoai) {
    profileError.value = 'Vui lòng điền đầy đủ thông tin'
    return
  }

  savingUser.value   = true
  profileError.value = ''
  profileSuccess.value = false

  try {
    const userId = authStore.user?.id
    if (!userId) throw new Error('Không tìm thấy user_id')

    await api.put(`/users/${userId}`, {
      hoTen:       profileForm.hoTen,
      email:       profileForm.email,
      soDienThoai: profileForm.soDienThoai,
    })

    authStore.user = {
      ...authStore.user!,
      hoTen:       profileForm.hoTen,
      email:       profileForm.email,
      soDienThoai: profileForm.soDienThoai,
    }
    localStorage.setItem('user', JSON.stringify(authStore.user))

    profileSuccess.value = true
    setTimeout(() => profileSuccess.value = false, 3000)
  } catch (e: any) {
    profileError.value = e.response?.data?.message || 'Lỗi cập nhật thông tin cá nhân'
  } finally {
    savingUser.value = false
  }
}

async function updateTenantInfo() {
  if (!tenantForm.tenBanQuanLy || !tenantForm.diachi || !tenantForm.maSoThue) {
    tenantError.value = 'Vui lòng điền đầy đủ các trường bắt buộc'
    return
  }

  savingTenant.value  = true
  tenantError.value   = ''
  tenantSuccess.value = false

  try {
    const tenantId = authStore.user?.tenant_id
    if (!tenantId) throw new Error('Không tìm thấy tenant_id')

    await api.put(`/tenant/${tenantId}`, {
      tenBanQuanLy: tenantForm.tenBanQuanLy,
      diachi:       tenantForm.diachi,
      maSoThue:     tenantForm.maSoThue,
      tenCongTy:    tenantForm.tenCongTy    || null,
      nguoiDaiDien: tenantForm.nguoiDaiDien || null,
      chucVu:       tenantForm.chucVu       || null,
      email:        tenantForm.email,
      soDienThoai:  tenantForm.soDienThoai,
    })

    tenantSuccess.value = true
    setTimeout(() => tenantSuccess.value = false, 3000)
  } catch (e: any) {
    tenantError.value = e.response?.data?.message || 'Lỗi cập nhật thông tin BQL'
  } finally {
    savingTenant.value = false
  }
}

async function changePassword() {
  pwdError.value   = ''
  pwdSuccess.value = false

  if (!pwdForm.newPassword) {
    pwdError.value = 'Vui lòng nhập mật khẩu mới'
    return
  }
  if (pwdForm.newPassword !== pwdForm.confirmPassword) {
    pwdError.value = 'Mật khẩu xác nhận không khớp'
    return
  }
  if (pwdStrength.value < 2) {
    pwdError.value = 'Mật khẩu quá yếu'
    return
  }

  savingPwd.value = true

  try {
    const userId = authStore.user?.id
    if (!userId) throw new Error('Không tìm thấy user_id')

    await api.put(`/users/${userId}/password`, {
      newPassword: pwdForm.newPassword,
    })

    pwdSuccess.value = true
    pwdForm.newPassword     = ''
    pwdForm.confirmPassword = ''
    setTimeout(() => pwdSuccess.value = false, 3000)
  } catch (e: any) {
    pwdError.value = e.response?.data?.message || 'Lỗi đổi mật khẩu'
  } finally {
    savingPwd.value = false
  }
}
</script>

<style scoped>
.profile-page { display: flex; flex-direction: column; gap: 22px; }
.page-header { display: flex; justify-content: space-between; align-items: flex-start; }
.page-title { font-size: 22px; font-weight: 600; color: #1a2e1a; margin: 0 0 4px; letter-spacing: -.3px; }
.page-sub { font-size: 13px; color: #6b836b; margin: 0; }

.profile-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.profile-card { grid-column: 1 / -1; }

.card { background: white; border: 1px solid #e2ede2; border-radius: 14px; overflow: hidden; }
.card-head { padding: 15px 20px; border-bottom: 1px solid #f0f5f0; }
.card-title { font-size: 14.5px; font-weight: 600; color: #1a2e1a; margin: 0; }
.card-body { padding: 20px; display: flex; flex-direction: column; gap: 14px; }

.avatar-section { display: flex; align-items: center; gap: 20px; padding: 22px; }
.avatar-lg { width: 72px; height: 72px; background: #3d8c3d; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-size: 22px; font-weight: 600; flex-shrink: 0; }
.profile-name { font-size: 20px; font-weight: 600; color: #1a2e1a; margin-bottom: 4px; }
.profile-email { font-size: 13.5px; color: #6b836b; margin-bottom: 8px; }
.role-badge { display: inline-flex; padding: 3px 10px; background: #eef7ee; color: #2d6e2d; border-radius: 20px; font-size: 12px; font-weight: 600; }

.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.pwd-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.field { display: flex; flex-direction: column; gap: 5px; }
.field label { font-size: 12.5px; font-weight: 500; color: #3a4f3a; }
.req { color: #dc2626; }
.field input { width: 100%; height: 42px; padding: 0 12px; border: 1.5px solid #d4e4d4; border-radius: 10px; font-size: 13.5px; font-family: 'Be Vietnam Pro', sans-serif; color: #1a2e1a; background: #fbfdfb; outline: none; transition: border 0.2s; box-sizing: border-box; }
.field input:focus { border-color: #3d8c3d; background: white; }

.input-wrap { position: relative; display: flex; align-items: center; }
.input-wrap input { padding-right: 40px; }
.eye-btn { position: absolute; right: 12px; background: none; border: none; color: #94a894; cursor: pointer; display: flex; align-items: center; padding: 0; }
.eye-btn:hover { color: #3d8c3d; }

.pwd-strength { display: flex; align-items: center; gap: 10px; }
.strength-bars { display: flex; gap: 4px; }
.strength-bar { width: 40px; height: 4px; background: #e2ede2; border-radius: 2px; transition: background 0.2s; }
.strength-bar.active.s1 { background: #ef4444; }
.strength-bar.active.s2 { background: #f97316; }
.strength-bar.active.s3 { background: #eab308; }
.strength-bar.active.s4 { background: #3d8c3d; }
.strength-label { font-size: 12px; color: #6b836b; }

.form-actions { display: flex; justify-content: flex-end; padding-top: 4px; }

.btn-primary { display: inline-flex; align-items: center; gap: 7px; height: 40px; padding: 0 20px; background: #3d8c3d; border: none; border-radius: 10px; color: white; font-size: 13.5px; font-weight: 500; font-family: 'Be Vietnam Pro', sans-serif; cursor: pointer; transition: background 0.15s; }
.btn-primary:hover:not(:disabled) { background: #2d6e2d; }
.btn-primary:disabled { opacity: 0.55; cursor: not-allowed; }

.success-banner { background: #eef7ee; border: 1px solid #d4e4d4; border-radius: 9px; padding: 10px 14px; color: #2d6e2d; font-size: 13px; }
.error-banner { background: #fef2f2; border: 1px solid #fecaca; border-radius: 9px; padding: 10px 14px; color: #b91c1c; font-size: 13px; }

.spin { width: 14px; height: 14px; border: 2px solid rgba(255,255,255,0.35); border-top-color: white; border-radius: 50%; animation: spin 0.65s linear infinite; display: inline-block; }
@keyframes spin { to { transform: rotate(360deg); } }

@media (max-width: 768px) { .profile-grid { grid-template-columns: 1fr; } .form-row, .pwd-row { grid-template-columns: 1fr; } }
</style>