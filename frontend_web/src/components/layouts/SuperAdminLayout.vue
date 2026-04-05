<template>
  <div class="sa-shell" :class="{ collapsed: sidebarCollapsed }">

    <aside class="sa-sidebar">
      <div class="sidebar-top">
        <div class="sidebar-logo">
          <img src="/logo.png" alt="MarketHub" class="logo-img" :class="{ 'logo-collapsed': sidebarCollapsed }" />
        </div>
        <button class="collapse-btn" @click="sidebarCollapsed = !sidebarCollapsed">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
      </div>

      <div class="role-badge">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
        <span>Super Admin</span>
      </div>

      <nav class="sidebar-nav">
        <div v-for="group in navGroups" :key="group.label" class="nav-group">
          <div class="nav-group-label">{{ group.label }}</div>
          <router-link
            v-for="item in group.items"
            :key="item.to"
            :to="item.to"
            class="nav-item"
            active-class="nav-item--active"
          >
            <span class="nav-icon" v-html="item.icon"></span>
            <span class="nav-text">{{ item.label }}</span>
            <span v-if="item.badge" class="nav-badge">{{ item.badge }}</span>
          </router-link>
        </div>
      </nav>

      <div class="sidebar-footer">
        <div class="user-card">
          <div class="user-avatar">{{ userInitials }}</div>
          <div class="user-info">
            <div class="user-name">{{ authStore.user?.hoTen || 'Super Admin' }}</div>
            <div class="user-email">{{ authStore.user?.email }}</div>
          </div>
        </div>
        <button class="logout-btn" @click="handleLogout">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
          <span>Đăng xuất</span>
        </button>
      </div>
    </aside>

    <div class="sa-body">
      <header class="sa-topbar">
        <div class="topbar-left">
          <button class="mobile-menu-btn" @click="sidebarCollapsed = !sidebarCollapsed">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
          </button>
          <div class="breadcrumb">
            <span class="breadcrumb-root">MarketHub</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
            <span class="breadcrumb-current">{{ currentPageTitle }}</span>
          </div>
        </div>
        <div class="topbar-right">
          <button class="topbar-icon-btn" @click="goTo('/super-admin/notifications')" title="Thông báo">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
            <span v-if="unreadCount > 0" class="notif-dot">{{ unreadCount }}</span>
          </button>
          <div class="topbar-avatar" @click="goTo('/super-admin/profile')">{{ userInitials }}</div>
        </div>
      </header>

      <main class="sa-main">
        <router-view />
      </main>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import api from '@/api/axios'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const sidebarCollapsed = ref(false)
const unreadCount = ref(0)

interface NavItem {
  to: string
  label: string
  icon: string
  badge?: number | string  
}

interface NavGroup {
  label: string
  items: NavItem[]
}

const userInitials = computed(() => {
  const name = authStore.user?.hoTen || ''
  return name.split(' ').map((w: string) => w[0]).slice(-2).join('').toUpperCase() || 'SA'
})

const currentPageTitle = computed(() => {
  const matched = route.matched
  return matched[matched.length - 1]?.meta?.title as string || 'Dashboard'
})

const navGroups: NavGroup[] = [
  {
    label: 'Tổng quan',
    items: [
      { to: '/super-admin/dashboard', label: 'Dashboard', icon: iconGrid() },
    ]
  },
  {
    label: 'Quản lý Tenant',
    items: [
      { to: '/super-admin/tenants', label: 'Danh sách Tenant', icon: iconBuilding() },
    ]
  },
  {
    label: 'Gói cước',
    items: [
      { to: '/super-admin/plans', label: 'Danh sách Plan', icon: iconPackage() },
      { to: '/super-admin/subscriptions', label: 'Subscriptions', icon: iconRefresh() },
    ]
  },
  {
    label: 'Báo cáo & Log',
    items: [
      { to: '/super-admin/audit-logs', label: 'Audit Log', icon: iconLog() },
    ]
  },
  {
    label: 'Hệ thống',
    items: [
      { to: '/super-admin/notifications', label: 'Thông báo', icon: iconBell() },
      { to: '/super-admin/profile', label: 'Profile', icon: iconProfile() },
    ]
  },
]

function goTo(path: string) { router.push(path) }

async function handleLogout() {
  await api.post('/auth/logout').catch(() => {})
  localStorage.removeItem('token')
  localStorage.removeItem('user')
  localStorage.removeItem('role')
  authStore.token = null
  authStore.user = null
  await router.replace('/login')
}

onMounted(async () => {
  try {
    const res = await api.get('/notifications/unread_count')
    unreadCount.value = res.data.count || 0
  } catch {}
})

function iconGrid() { return `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>` }
function iconBuilding() { return `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>` }
function iconPackage() { return `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>` }
function iconRefresh() { return `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>` }
function iconLog() { return `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>` }
function iconBell() { return `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>` }
function iconProfile() { return `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>` }
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@300;400;500;600&display=swap');

* { box-sizing: border-box; }

.sa-shell {
  display: flex;
  min-height: 100vh;
  font-family: 'Be Vietnam Pro', sans-serif;
  background: #f4f7f4;
}

.sa-sidebar {
  width: 256px;
  background: #ffffff;
  border-right: 1px solid #e2ede2;
  display: flex;
  flex-direction: column;
  position: fixed;
  top: 0; left: 0; bottom: 0;
  z-index: 100;
  transition: width 0.25s ease;
  overflow: hidden;
}

.sa-shell.collapsed .sa-sidebar { width: 64px; }
.sa-shell.collapsed .logo-label,
.sa-shell.collapsed .nav-text,
.sa-shell.collapsed .nav-badge,
.sa-shell.collapsed .nav-group-label,
.sa-shell.collapsed .role-badge span,
.sa-shell.collapsed .user-info,
.sa-shell.collapsed .logout-btn span { display: none; }
.sa-shell.collapsed .collapse-btn svg { transform: rotate(180deg); }

.sidebar-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 16px 14px;
  border-bottom: 1px solid #f0f5f0;
}

.sidebar-logo {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  overflow: hidden;
  flex: 1;
}

.logo-img {
  width: 100px;
  height: 100px;
  object-fit: contain;
  flex-shrink: 0;
  transition: all 0.25s ease;
}

.logo-label {
  font-size: 15px;
  font-weight: 600;
  color: #1a2e1a;
  white-space: nowrap;
}

.sa-shell.collapsed .logo-img {
  width: 32px;
  height: 32px;
}

.collapse-btn {
  background: none; border: none;
  color: #94a894; cursor: pointer;
  display: flex; align-items: center;
  padding: 4px; border-radius: 6px;
  transition: background 0.15s;
  flex-shrink: 0;
}
.collapse-btn:hover { background: #f0f5f0; color: #3d8c3d; }
.collapse-btn svg { transition: transform 0.25s; }

.role-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 10px 14px;
  padding: 5px 10px;
  background: #eef7ee;
  border-radius: 20px;
  color: #3d8c3d;
  font-size: 11.5px;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
}

.sidebar-nav {
  flex: 1;
  overflow-y: auto;
  padding: 8px 10px;
  scrollbar-width: thin;
  scrollbar-color: #e2ede2 transparent;
}

.nav-group { margin-bottom: 6px; }

.nav-group-label {
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.07em;
  text-transform: uppercase;
  color: #b0c4b0;
  padding: 8px 8px 4px;
  white-space: nowrap;
  overflow: hidden;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 10px;
  border-radius: 9px;
  color: #4a654a;
  font-size: 13.5px;
  text-decoration: none;
  transition: background 0.15s, color 0.15s;
  margin-bottom: 2px;
  white-space: nowrap;
  overflow: hidden;
}
.nav-item:hover { background: #f0f7f0; color: #2d6e2d; }
.nav-item--active { background: #eef7ee; color: #2d6e2d; font-weight: 500; }
.nav-item--active .nav-icon { color: #3d8c3d; }

.nav-icon { flex-shrink: 0; display: flex; align-items: center; color: #7a9a7a; }
.nav-item--active .nav-icon { color: #3d8c3d; }

.nav-badge {
  margin-left: auto;
  background: #ef4444;
  color: white;
  font-size: 10px;
  font-weight: 600;
  padding: 1px 6px;
  border-radius: 10px;
  flex-shrink: 0;
}

.sidebar-footer {
  padding: 12px 10px;
  border-top: 1px solid #f0f5f0;
}

.user-card {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px;
  border-radius: 9px;
  margin-bottom: 6px;
  overflow: hidden;
}

.user-avatar {
  width: 34px; height: 34px;
  background: #3d8c3d;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 12px;
  font-weight: 600;
  flex-shrink: 0;
}

.user-info { overflow: hidden; }
.user-name { font-size: 12.5px; font-weight: 500; color: #1a2e1a; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.user-email { font-size: 11px; color: #94a894; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

.logout-btn {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  background: none;
  border: 1px solid #fecaca;
  border-radius: 9px;
  color: #dc2626;
  font-size: 13px;
  font-family: 'Be Vietnam Pro', sans-serif;
  cursor: pointer;
  transition: background 0.15s;
  white-space: nowrap;
  overflow: hidden;
}
.logout-btn:hover { background: #fef2f2; }

.sa-body {
  flex: 1;
  margin-left: 256px;
  transition: margin-left 0.25s ease;
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}
.sa-shell.collapsed .sa-body { margin-left: 64px; }

.sa-topbar {
  height: 58px;
  background: #ffffff;
  border-bottom: 1px solid #e2ede2;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  position: sticky;
  top: 0;
  z-index: 50;
}

.topbar-left { display: flex; align-items: center; gap: 12px; }

.mobile-menu-btn {
  display: none;
  background: none; border: none;
  color: #4a654a; cursor: pointer;
  padding: 4px;
}

.breadcrumb {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13.5px;
}
.breadcrumb-root { color: #94a894; }
.breadcrumb-current { color: #1a2e1a; font-weight: 500; }
.breadcrumb svg { color: #b0c4b0; }

.topbar-right { display: flex; align-items: center; gap: 10px; }

.topbar-icon-btn {
  position: relative;
  width: 36px; height: 36px;
  background: none; border: 1px solid #e2ede2;
  border-radius: 9px;
  display: flex; align-items: center; justify-content: center;
  color: #4a654a; cursor: pointer;
  transition: background 0.15s;
}
.topbar-icon-btn:hover { background: #f0f7f0; }

.notif-dot {
  position: absolute;
  top: -4px; right: -4px;
  background: #ef4444;
  color: white;
  font-size: 9px;
  font-weight: 700;
  width: 16px; height: 16px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid white;
}

.topbar-avatar {
  width: 34px; height: 34px;
  background: #3d8c3d;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
}

.sa-main {
  flex: 1;
  padding: 24px;
  overflow-y: auto;
}

@media (max-width: 768px) {
  .mobile-menu-btn { display: flex; }
  .sa-sidebar {
    transform: translateX(-100%);
    transition: transform 0.25s;
  }
  .sa-shell:not(.collapsed) .sa-sidebar { transform: translateX(0); }
  .sa-body { margin-left: 0 !important; }
}
</style>