import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authAPI, LoginCredentials } from '@/api/auth'
import { User } from '@/types'
import router from '@/router'

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(localStorage.getItem('token'))
  const user = ref<User | null>(null)
  
  // Khởi tạo user từ localStorage
  const savedUser = localStorage.getItem('user')
  if (savedUser) {
    user.value = JSON.parse(savedUser)
  }

  const isAuthenticated = computed(() => !!token.value)
  const userRole = computed(() => user.value?.role)
  const isSuperAdmin = computed(() => user.value?.role === 'super_admin')
  const isTenantAdmin = computed(() => user.value?.role === 'tenant_admin')
  const isCollector = computed(() => user.value?.role === 'collector')
  const isMerchant = computed(() => user.value?.role === 'merchant')

  // Đăng nhập bằng email/password
  const login = async (credentials: LoginCredentials) => {
    try {
      const response = await authAPI.login(credentials)
      const { token: newToken, user: userData } = response.data

      token.value = newToken
      user.value = userData

      localStorage.setItem('token', newToken)
      localStorage.setItem('user', JSON.stringify(userData))
      localStorage.setItem('role', userData.role)

      return { success: true, role: userData.role }
    } catch (error: any) {
      return { 
        success: false, 
        error: error.response?.data?.message || 'Đăng nhập thất bại' 
      }
    }
  }

  // Đăng nhập bằng Google (Firebase)
  const googleLogin = async (googleToken: string) => {
    try {
      const response = await authAPI.googleLogin({ idToken: googleToken })
      const { token: newToken, user: userData } = response.data

      token.value = newToken
      user.value = userData

      localStorage.setItem('token', newToken)
      localStorage.setItem('user', JSON.stringify(userData))
      localStorage.setItem('role', userData.role)

      return { success: true, role: userData.role }
    } catch (error: any) {
      return { 
        success: false, 
        error: error.response?.data?.message || 'Đăng nhập Google thất bại' 
      }
    }
  }

  // Đăng xuất
  const logout = async () => {
    try {
      await authAPI.logout()
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      token.value = null
      user.value = null
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      localStorage.removeItem('role')
      router.push('/login')
    }
  }

  return {
    token,
    user,
    isAuthenticated,
    userRole,
    isSuperAdmin,
    isTenantAdmin,
    isCollector,
    isMerchant,
    login,
    googleLogin,
    logout,
  }
})