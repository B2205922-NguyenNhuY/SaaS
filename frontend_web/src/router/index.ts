import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/auth/Login.vue'),
    meta: { requiresGuest: true },
  },

  {
    path: '/super-admin',
    component: () => import('@/components/layouts/SuperAdminLayout.vue'),
    meta: { requiresAuth: true, role: 'super_admin' },
    children: [
      { path: '', redirect: '/super-admin/dashboard' },
      {
        path: 'dashboard',
        name: 'SuperDashboard',
        component: () => import('@/views/superadmin/Dashboard.vue'),
        meta: { title: 'Dashboard' },
      },
      {
        path: 'tenants',
        name: 'Tenants',
        component: () => import('@/views/superadmin/Tenants.vue'),
        meta: { title: 'Danh sách Tenant' },
      },
      {
        path: 'plans',
        name: 'Plans',
        component: () => import('@/views/superadmin/Plans.vue'),
        meta: { title: 'Gói cước' },
      },
      {
        path: 'subscriptions',
        name: 'Subscriptions',
        component: () => import('@/views/superadmin/Subscriptions.vue'),
        meta: { title: 'Subscriptions' },
      },
      {
        path: 'audit-logs',
        name: 'AuditLogs',
        component: () => import('@/views/superadmin/AuditLog.vue'),
        meta: { title: 'Audit Log' },
      },
      {
        path: 'notifications',
        name: 'SuperNotifications',
        component: () => import('@/views/superadmin/Notifications.vue'),
        meta: { title: 'Thông báo' },
      },
      {
        path: 'profile',
        name: 'SuperProfile',
        component: () => import('@/views/superadmin/Profile.vue'),
        meta: { title: 'Profile' },
      },
    ],
  },

  {
    path: '/tenant-admin',
    component: () => import('@/components/layouts/TenantAdminLayout.vue'),
    meta: { requiresAuth: true, role: 'tenant_admin' },
    children: [
      { path: '', redirect: '/tenant-admin/dashboard' },
      {
        path: 'dashboard',
        name: 'TenantDashboard',
        component: () => import('@/views/tenantadmin/Dashboard.vue'),
        meta: { title: 'Dashboard' },
      },
      {
        path: 'markets',
        name: 'Markets',
        component: () => import('@/views/tenantadmin/Markets.vue'),
        meta: { title: 'Quản lý Chợ' },
      },
      {
        path: 'kiosks',
        name: 'Kiosks',
        component: () => import('@/views/tenantadmin/Kiosks.vue'),
        meta: { title: 'Quản lý Sạp' },
      },
      {
        path: 'users',
        name: 'Users',
        component: () => import('@/views/tenantadmin/Users.vue'),
        meta: { title: 'Quản lý Người dùng' },
      },
      {
        path: 'fees',
        name: 'Fees',
        component: () => import('@/views/tenantadmin/FeeManagement.vue'),
        meta: { title: 'Quản lý Phí' },
      },
      {
        path: 'notifications',
        name: 'TenantNotifications',
        component: () => import('@/views/tenantadmin/Notifications.vue'),
        meta: { title: 'Thông báo' },
      },
      {
        path: 'profile',
        name: 'TenantProfile',
        component: () => import('@/views/tenantadmin/Profile.vue'),
        meta: { title: 'Profile' },
      },
      {
        path: 'audit-logs',
        name: 'TenantAuditLogs',
        component: () => import('@/views/tenantadmin/AuditLog.vue'),
        meta: { title: 'Audit Log' },
      },
      {
        path: 'reports',
        name: 'Report',
        component: () => import('@/views/tenantadmin/Report.vue'),
        meta: {title: 'Báo cáo'},
      },
      {
        path: 'charges',
        name: 'Charge',
        component: () => import('@/views/tenantadmin/Charge.vue'),
        meta: {title: 'Khoản thu'},
      },
      {
        path: 'collection_periods',
        name: 'CollectionPeriod',
        component: () => import('@/views/tenantadmin/CollectionPeriod.vue'),
        meta: {title: 'Kỳ thu'},
      },
      {
        path: 'debts',
        name: 'Debt',
        component: () => import('@/views/tenantadmin/Debt.vue'),
        meta: {title: 'Công nợ'},
      },
      {
        path: 'merchants',
        name: 'Merchant',
        component: () => import('@/views/tenantadmin/Merchant.vue'),
        meta: {title: 'Tiểu thương'},
      },
      {
        path: 'plans',
        name: 'Plan',
        component: () => import('@/views/tenantadmin/Plan.vue'),
        meta: {title: 'Gói cước'},
      },
      {
        path: 'receipts',
        name: 'Receipt',
        component: () => import('@/views/tenantadmin/Receipt.vue'),
        meta: {title: 'Phiếu thu'},
      },
      {
        path: 'shifts',
        name: 'Shift',
        component: () => import('@/views/tenantadmin/Shift.vue'),
        meta: {title: 'Ca làm'},
      },
      {
        path: 'zones',
        name: 'Zone',
        component: () => import('@/views/tenantadmin/Zone.vue'),
        meta: {title: 'Khu vực'},
      },   
      {
        path: 'payment-success',
        name: 'Payment',
        component: () => import('@/views/tenantadmin/Payment.vue'),
        meta: {title: 'Thanh toán thành công'},
      },     
    ],
  },

  {
    path: '/',
    redirect: () => {
      const role = localStorage.getItem('role')
      if (role === 'super_admin') return '/super-admin/dashboard'
      if (role === 'tenant_admin') return '/tenant-admin/dashboard'
      return '/login'
    },
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach((to, _from, next) => {
  const authStore = useAuthStore()
  const requiresAuth = to.meta.requiresAuth
  const requiredRole = to.meta.role as string | undefined

  console.log('authStore:', authStore)
  console.log('isAuthenticated:', authStore?.isAuthenticated)
  console.log('to.path:', to.path)

  // 1. Route cần login nhưng chưa login
  if (requiresAuth && !authStore.isAuthenticated) {
    if (to.path !== '/login') return next('/login') // ✅ chỉ redirect 1 lần
    return next() // đã ở /login thì tiếp tục
  }

  // 2. Route cần role nhưng user không có role
  if (requiresAuth && requiredRole && authStore.userRole !== requiredRole) {
    if (authStore.isSuperAdmin && to.path !== '/super-admin/dashboard') return next('/super-admin/dashboard')
    if (authStore.isTenantAdmin && to.path !== '/tenant-admin/dashboard') return next('/tenant-admin/dashboard')
    if (to.path !== '/login') return next('/login')
    return next()
  }

  // 3. Route guest nhưng đã login
  if (to.meta.requiresGuest && authStore.isAuthenticated) {
    if (authStore.isSuperAdmin && to.path !== '/super-admin/dashboard') return next('/super-admin/dashboard')
    if (authStore.isTenantAdmin && to.path !== '/tenant-admin/dashboard') return next('/tenant-admin/dashboard')
    if (to.path !== '/login') return next('/login')
    return next()
  }

  // 4. Route bình thường
  next()
})

export default router