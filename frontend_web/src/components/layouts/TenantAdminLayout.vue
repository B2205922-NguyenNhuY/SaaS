<template>
  <div class="dashboard-container">
    <div class="sidebar">
      <div class="sidebar-header">
        <h2>MarketHub</h2>
        <p style="font-size: 12px; margin-top: 8px; color: #666">
          {{ user?.hoTen || 'Tenant Admin' }}
        </p>
      </div>
      <div class="sidebar-nav">
        <div
          class="nav-item"
          :class="{ active: $route.path.includes('/tenant-admin/dashboard') }"
          @click="$router.push('/tenant-admin/dashboard')"
        >
          Dashboard
        </div>
        <div
          class="nav-item"
          :class="{ active: $route.path.includes('/tenant-admin/markets') }"
          @click="$router.push('/tenant-admin/markets')"
        >
          Quản lý chợ
        </div>
        <div
          class="nav-item"
          :class="{ active: $route.path.includes('/tenant-admin/kiosks') }"
          @click="$router.push('/tenant-admin/kiosks')"
        >
          Quản lý kiosk
        </div>
        <div
          class="nav-item"
          :class="{ active: $route.path.includes('/tenant-admin/users') }"
          @click="$router.push('/tenant-admin/users')"
        >
          Quản lý người dùng
        </div>
        <div
          class="nav-item"
          :class="{ active: $route.path.includes('/tenant-admin/fees') }"
          @click="$router.push('/tenant-admin/fees')"
        >
          Biểu phí
        </div>
      </div>
    </div>

    <div class="main-content">
      <div class="top-bar">
        <h3>{{ pageTitle }}</h3>
        <div class="user-info">
          <span>👤 {{ user?.hoTen || user?.email }}</span>
          <button class="logout-btn" @click="handleLogout">Đăng xuất</button>
        </div>
      </div>
      <router-view />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const user = computed(() => authStore.user)

const pageTitle = computed(() => {
  const path = route.path
  if (path.includes('dashboard')) return 'Dashboard'
  if (path.includes('markets')) return 'Quản lý chợ'
  if (path.includes('kiosks')) return 'Quản lý kiosk'
  if (path.includes('users')) return 'Quản lý người dùng'
  if (path.includes('fees')) return 'Quản lý biểu phí'
  return 'Tenant Admin'
})

const handleLogout = async () => {
  await authStore.logout()
}
</script>