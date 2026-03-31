<template>
  <div class="login-page">

    <div class="left-panel">
      <div class="left-inner">

        <div class="brand">
          <img src="/logo.png" alt="MarketHub" class="brand-logo" />
        </div>

        <div class="brand-tagline">
          <h2>Hệ thống quản lý<br/>chợ truyền thống</h2>
          <p>Nền tảng số hóa toàn diện dành cho<br/>các ban quản lý chợ truyền thống Việt Nam</p>
        </div>

        <div class="feature-list">
          <div class="feature-item">
            <div class="feature-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
            </div>
            <span>Quản lý tập trung đa chợ</span>
          </div>
          <div class="feature-item">
            <div class="feature-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            </div>
            <span>Phân quyền linh hoạt</span>
          </div>
          <div class="feature-item">
            <div class="feature-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
            </div>
            <span>Báo cáo thời gian thực</span>
          </div>
          <div class="feature-item">
            <div class="feature-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            </div>
            <span>Bảo mật dữ liệu chuẩn</span>
          </div>
        </div>

        <div class="contact-block">
          <div class="contact-label">Liên hệ hỗ trợ quản trị viên</div>
          <div class="contact-item">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
            <span>admin@markethub.vn</span>
          </div>
          <div class="contact-item">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 2.18h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.29 6.29l.95-.95a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
            <span>1800 9999</span>
          </div>
        </div>

      </div>
    </div>

    <div class="right-panel">
      <div class="login-box">

        <div class="login-heading">
          <h1>Chào mừng trở lại</h1>
          <p>Đăng nhập vào tài khoản quản trị của bạn</p>
        </div>

        <transition name="err">
          <div v-if="errorMessage" class="error-banner">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            {{ errorMessage }}
          </div>
        </transition>

        <form @submit.prevent="handleLogin" novalidate>
          <div class="field">
            <label>Email</label>
            <div class="input-wrap">
              <svg class="input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
              <input
                type="email"
                v-model="credentials.email"
                placeholder="admin@markethub.vn"
                required
                :disabled="loading || googleLoading"
              />
            </div>
          </div>

          <div class="field">
            <div class="field-row">
              <label>Mật khẩu</label>
              <a href="#" class="forgot-link" @click.prevent>Quên mật khẩu?</a>
            </div>
            <div class="input-wrap">
              <svg class="input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              <input
                :type="showPwd ? 'text' : 'password'"
                v-model="credentials.password"
                placeholder="••••••••"
                required
                :disabled="loading || googleLoading"
              />
              <button type="button" class="eye-btn" @click="showPwd = !showPwd" tabindex="-1">
                <svg v-if="!showPwd" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
              </button>
            </div>
          </div>

          <div class="remember-row">
            <label class="checkbox-label">
              <input type="checkbox" v-model="rememberMe" />
              Ghi nhớ đăng nhập
            </label>
          </div>

          <button type="submit" class="btn-primary" :disabled="loading || googleLoading">
            <span v-if="loading" class="spin"></span>
            {{ loading ? 'Đang xác thực...' : 'Đăng nhập' }}
          </button>
        </form>

        <div class="divider"><span>hoặc</span></div>

        <button class="btn-google" @click="handleGoogleLogin" :disabled="loading || googleLoading">
          <span v-if="googleLoading" class="spin spin-dark"></span>
          <svg v-else width="18" height="18" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          {{ googleLoading ? 'Đang xử lý...' : 'Đăng nhập với Google' }}
        </button>

        <p class="footer-note">© 2025 MarketHub · Dành cho quản trị viên</p>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { auth, googleProvider, signInWithPopup } from '@/firebase/config'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const credentials = ref({ email: '', password: '' })
const loading = ref(false)
const googleLoading = ref(false)
const errorMessage = ref('')
const showPwd = ref(false)
const rememberMe = ref(false)

const handleLogin = async () => {
  if (!credentials.value.email || !credentials.value.password) {
    errorMessage.value = 'Vui lòng nhập email và mật khẩu'
    return
  }
  loading.value = true
  errorMessage.value = ''
  const result = await authStore.login({
    email: credentials.value.email,
    password: credentials.value.password
  })
  if (result.success) {
    redirectByRole(result.role)
  } else {
    errorMessage.value = result.error || 'Đăng nhập thất bại'
  }
  loading.value = false
}

const handleGoogleLogin = async () => {
  googleLoading.value = true
  errorMessage.value = ''
  try {
    const result = await signInWithPopup(auth, googleProvider)
    const idToken = await result.user.getIdToken()
    const loginResult = await authStore.googleLogin(idToken)
    if (loginResult.success) {
      redirectByRole(loginResult.role)
    } else {
      errorMessage.value = loginResult.error || 'Đăng nhập Google thất bại'
    }
  } catch (error: any) {
    if (error.code === 'auth/popup-closed-by-user') errorMessage.value = 'Đã đóng cửa sổ đăng nhập'
    else if (error.code === 'auth/cancelled-popup-request') errorMessage.value = 'Đã hủy đăng nhập'
    else errorMessage.value = error.message || 'Đăng nhập Google thất bại'
  } finally {
    googleLoading.value = false
  }
}

const redirectByRole = (role: string | undefined) => {
  if (role === 'super_admin') router.push('/super-admin/dashboard')
  else if (role === 'tenant_admin') router.push('/tenant-admin/dashboard')
  else {
    localStorage.clear()
    router.push('/login')
  }
}

</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@300;400;500;600&display=swap');

.login-page {
  min-height: 100vh;
  display: flex;
  font-family: 'Be Vietnam Pro', sans-serif;
}

.left-panel {
  width: 45%;
  background: linear-gradient(160deg, #52a852 0%, #3d8c3d 40%, #2d6e2d 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 3rem 2.5rem;
  position: relative;
  overflow: hidden;
}

.left-panel::before {
  content: '';
  position: absolute;
  top: -80px; right: -80px;
  width: 300px; height: 300px;
  border-radius: 50%;
  background: rgba(255,255,255,0.05);
}
.left-panel::after {
  content: '';
  position: absolute;
  bottom: -60px; left: -60px;
  width: 240px; height: 240px;
  border-radius: 50%;
  background: rgba(255,255,255,0.04);
}

.left-inner {
  position: relative;
  z-index: 1;
  max-width: 360px;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.brand {
  margin-bottom: 2rem;
  display: flex;
  justify-content: center;
}

.brand-logo {
  height: 200px;
  width: auto;
  object-fit: contain;
}

.brand-tagline {
  text-align: center;
  width: 100%;
}

.brand-tagline h2 {
  font-size: 26px;
  font-weight: 600;
  color: #ffffff;
  line-height: 1.35;
  margin-bottom: 12px;
  letter-spacing: -0.3px;
}

.brand-tagline p {
  font-size: 14px;
  color: rgba(255,255,255,0.72);
  line-height: 1.65;
  margin-bottom: 2.5rem;
}

.feature-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
  margin-bottom: 2.5rem;
  width: 100%;
}

.feature-item {
  display: flex;
  align-items: center;
  gap: 12px;
  color: rgba(255,255,255,0.9);
  font-size: 14px;
}

.feature-icon {
  width: 34px; height: 34px;
  background: rgba(255,255,255,0.15);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: #fff;
}

.contact-block {
  border-top: 1px solid rgba(255,255,255,0.18);
  padding-top: 1.5rem;
  width: 100%;
}

.contact-label {
  font-size: 11px;
  font-weight: 600;
  color: rgba(255,255,255,0.5);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  margin-bottom: 12px;
}

.contact-item {
  display: flex;
  align-items: center;
  gap: 8px;
  color: rgba(255,255,255,0.8);
  font-size: 13.5px;
  margin-bottom: 8px;
}
.contact-item svg { flex-shrink: 0; opacity: 0.7; }

.right-panel {
  flex: 1;
  background: #f7faf7;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem 1.5rem;
}

.login-box {
  width: 100%;
  max-width: 420px;
  background: #ffffff;
  border-radius: 20px;
  border: 1px solid #e2ede2;
  padding: 2.5rem 2.25rem;
  box-shadow: 0 4px 24px rgba(61,140,61,0.08);
}

.login-heading {
  margin-bottom: 1.75rem;
  text-align: center;
}

.login-heading h1 {
  font-size: 24px;
  font-weight: 600;
  color: #1a2e1a;
  margin-bottom: 6px;
  letter-spacing: -0.3px;
}

.login-heading p {
  font-size: 13.5px;
  color: #6b836b;
}

.error-banner {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 10px;
  padding: 10px 14px;
  color: #b91c1c;
  font-size: 13px;
  margin-bottom: 1.25rem;
}

.err-enter-active, .err-leave-active { transition: all 0.25s; }
.err-enter-from, .err-leave-to { opacity: 0; transform: translateY(-6px); }

.field {
  margin-bottom: 1.1rem;
}

.field label {
  display: block;
  font-size: 13px;
  font-weight: 500;
  color: #3a4f3a;
  margin-bottom: 6px;
}

.field-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.field-row label {
  margin-bottom: 0;
}

.forgot-link {
  font-size: 12.5px;
  color: #3d8c3d;
  text-decoration: none;
  font-weight: 500;
}
.forgot-link:hover { color: #2d6e2d; }

.input-wrap {
  position: relative;
  display: flex;
  align-items: center;
}

.input-icon {
  position: absolute;
  left: 13px;
  color: #94a894;
  pointer-events: none;
}

.input-wrap input {
  width: 100%;
  height: 44px;
  padding: 0 42px 0 40px;
  border: 1.5px solid #d4e4d4;
  border-radius: 11px;
  font-size: 14px;
  font-family: 'Be Vietnam Pro', sans-serif;
  color: #1a2e1a;
  background: #fbfdfb;
  outline: none;
  transition: border 0.2s, box-shadow 0.2s;
  box-sizing: border-box;
}

.input-wrap input::placeholder { color: #b0c4b0; }
.input-wrap input:focus {
  border-color: #3d8c3d;
  box-shadow: 0 0 0 3px rgba(61,140,61,0.1);
  background: #fff;
}
.input-wrap input:disabled { background: #f5f8f5; cursor: not-allowed; color: #9aaa9a; }

.eye-btn {
  position: absolute; right: 12px;
  background: none; border: none;
  color: #94a894; cursor: pointer;
  display: flex; align-items: center;
  padding: 0;
}
.eye-btn:hover { color: #3d8c3d; }

.remember-row {
  margin-bottom: 1.25rem;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #4a654a;
  cursor: pointer;
}

.checkbox-label input[type="checkbox"] {
  width: 16px; height: 16px;
  accent-color: #3d8c3d;
  cursor: pointer;
}

.btn-primary {
  width: 100%;
  height: 46px;
  background: #3d8c3d;
  border: none;
  border-radius: 11px;
  color: #fff;
  font-size: 15px;
  font-weight: 600;
  font-family: 'Be Vietnam Pro', sans-serif;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: background 0.2s, transform 0.1s;
  letter-spacing: 0.01em;
}
.btn-primary:hover:not(:disabled) { background: #2d6e2d; }
.btn-primary:active:not(:disabled) { transform: scale(0.98); }
.btn-primary:disabled { opacity: 0.55; cursor: not-allowed; }

.divider {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 1.4rem 0;
  color: #a8bca8;
  font-size: 12px;
}
.divider::before, .divider::after {
  content: ''; flex: 1;
  height: 1px; background: #e2ede2;
}

.btn-google {
  width: 100%;
  height: 44px;
  background: #f7faf7;
  border: 1.5px solid #d4e4d4;
  border-radius: 11px;
  color: #2d4a2d;
  font-size: 14px;
  font-family: 'Be Vietnam Pro', sans-serif;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  transition: border 0.2s, background 0.2s;
}
.btn-google:hover:not(:disabled) {
  border-color: #3d8c3d;
  background: #eef6ee;
}
.btn-google:disabled { opacity: 0.55; cursor: not-allowed; }

.footer-note {
  text-align: center;
  font-size: 11.5px;
  color: #b0c4b0;
  margin-top: 1.75rem;
  margin-bottom: 0;
}

.spin {
  width: 16px; height: 16px;
  border: 2px solid rgba(255,255,255,0.35);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.65s linear infinite;
  display: inline-block;
  flex-shrink: 0;
}
.spin-dark {
  border: 2px solid rgba(0,0,0,0.12);
  border-top-color: #3d8c3d;
}
@keyframes spin { to { transform: rotate(360deg); } }

@media (max-width: 768px) {
  .login-page { flex-direction: column; }
  .left-panel { width: 100%; padding: 2rem 1.5rem; min-height: auto; }
  .feature-list { display: none; }
  .right-panel { padding: 1.5rem 1rem; }
  .login-box { padding: 2rem 1.5rem; border-radius: 16px; }
}
</style>