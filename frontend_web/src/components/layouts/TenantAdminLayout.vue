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
        <span>Tenant Admin</span>
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
            <div class="user-name">{{ authStore.user?.hoTen || 'Tenant Admin' }}</div>
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
          <div class="subscription-chip" v-if="currentPlan" @click="goTo('/tenant-admin/subscription')">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
            <span>{{ currentPlan }}</span>
          </div>
          <button class="topbar-icon-btn" @click="goTo('/tenant-admin/notifications')" title="Thông báo">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
            <span v-if="unreadCount > 0" class="notif-dot">{{ unreadCount > 9 ? '9+' : unreadCount }}</span>
          </button>
          <div class="topbar-avatar" @click="goTo('/tenant-admin/profile')">{{ userInitials }}</div>
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
const currentPlan = ref('')

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
  return name.split(' ').map((w: string) => w[0]).slice(-2).join('').toUpperCase() || 'TA'
})

const currentPageTitle = computed(() => {
  const matched = route.matched
  return matched[matched.length - 1]?.meta?.title as string || 'Dashboard'
})

const navGroups: NavGroup[] = [
  {
    label: 'Tổng quan',
    items: [
      { to: '/tenant-admin/dashboard', label: 'Dashboard', icon: iGrid() },
    ]
  },
  {
    label: 'Quản lý Chợ',
    items: [
      { to: '/tenant-admin/markets', label: 'Danh sách Chợ', icon: iMarket() },
      { to: '/tenant-admin/zones', label: 'Khu / Dãy', icon: iZone() },
      { to: '/tenant-admin/kiosks', label: 'Quản lý Kiosk', icon: iKiosk() },
    ]
  },
  {
    label: 'Tiểu thương',
    items: [
      { to: '/tenant-admin/merchants', label: 'Tiểu thương', icon: iMerchant() },
    ]
  },
  {
    label: 'Thu phí',
    items: [
      { to: '/tenant-admin/fees', label: 'Biểu phí', icon: iFee() },
      { to: '/tenant-admin/collection_periods', label: 'Kỳ thu', icon: iCalendar() },
      { to: '/tenant-admin/charges', label: 'Khoản thu', icon: iCharge() },
      { to: '/tenant-admin/receipts', label: 'Phiếu thu', icon: iReceipt() },
      { to: '/tenant-admin/debts', label: 'Công nợ', icon: iDebt() },
    ]
  },
  {
    label: 'Ca làm việc',
    items: [
      { to: '/tenant-admin/shifts', label: 'Quản lý Ca', icon: iShift() },
    ]
  },
  {
    label: 'Thu ngân',
    items: [
      { to: '/tenant-admin/users', label: 'Thu ngân', icon: iUsers() },
    ]
  },
  {
    label: 'Gói cước',
    items: [
      { to: '/tenant-admin/plans', label: 'Gói hiện tại', icon: iPackage() },
    ]
  },
  {
    label: 'Báo cáo & Log',
    items: [
      { to: '/tenant-admin/reports', label: 'Báo cáo', icon: iChart() },
      { to: '/tenant-admin/audit-logs', label: 'Audit Log', icon: iLog() },
    ]
  },
  {
    label: 'Hệ thống',
    items: [
      { to: '/tenant-admin/notifications', label: 'Thông báo', icon: iBell() },
      { to: '/tenant-admin/profile', label: 'Profile', icon: iProfile() },
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
  const [notifRes, subRes] = await Promise.allSettled([
    api.get('/notifications/unread_count'),
    api.get('/plan_subscription'),
  ])
  if (notifRes.status === 'fulfilled') unreadCount.value = notifRes.value.data.count || 0
  if (subRes.status === 'fulfilled') currentPlan.value = subRes.value.data?.planName || subRes.value.data?.tenGoi || ''
})

function iGrid() { return svg(`<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>`) }
function iMarket() { return svg(`<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>`) }
function iZone() { return svg(`<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M3 15h18M9 3v18M15 3v18"/>`) }
function iKiosk() { return svg(`<rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/><line x1="12" y1="12" x2="12" y2="16"/><line x1="10" y1="14" x2="14" y2="14"/>`) }
function iMerchant() { return svg(`<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>`) }
function iFee() { return svg(`<line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>`) }
function iCalendar() { return svg(`<rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>`) }
function iCharge() { return svg(`<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>`) }
function iReceipt() { return svg(`<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>`) }
function iDebt() { return svg(`<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>`) }
function iShift() { return svg(`<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>`) }
function iUsers() { return svg(`<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>`) }
function iPackage() { return svg(`<path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/>`) }
function iChart() { return svg(`<line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>`) }
function iLog() { return svg(`<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>`) }
function iBell() { return svg(`<path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>`) }
function iProfile() { return svg(`<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>`) }

function svg(paths: string): string {
  return `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${paths}</svg>`
}
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
  flex: 1;
  overflow: hidden;
}

.logo-img {
  width: 100px;
  height: 100px;
  object-fit: contain;
  flex-shrink: 0;
  transition: all 0.25s ease;
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
  display: flex; align-items: center; justify-content: center;
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
  flex-shrink: 0;
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

.subscription-chip {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 4px 10px;
  background: #eef7ee;
  border: 1px solid #c6e6c6;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  color: #2d6e2d;
  cursor: pointer;
  transition: background 0.15s;
  white-space: nowrap;
}
.subscription-chip:hover { background: #ddf0dd; }

.topbar-icon-btn {
  position: relative;
  width: 36px; height: 36px;
  background: none;
  border: 1px solid #e2ede2;
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
  min-width: 16px; height: 16px;
  border-radius: 8px;
  display: flex; align-items: center; justify-content: center;
  padding: 0 3px;
  border: 2px solid white;
}

.topbar-avatar {
  width: 34px; height: 34px;
  background: #3d8c3d;
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  color: white;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
}
.topbar-avatar:hover { opacity: 0.9; }

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
  .subscription-chip { display: none; }
}
</style>