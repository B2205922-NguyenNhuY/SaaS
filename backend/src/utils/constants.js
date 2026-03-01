module.exports = {
  PAYMENT_METHODS: {
    CASH: 'tien_mat',
    BANK_TRANSFER: 'chuyen_khoan'
  },

  CHARGE_STATUS: {
    UNPAID: 'chua_thu',
    PAID: 'da_thu',
    DEBT: 'no',
    EXEMPT: 'mien'
  },

  KIOSK_STATUS: {
    AVAILABLE: 'available',
    OCCUPIED: 'occupied',
    MAINTENANCE: 'maintenance',
    LOCKED: 'locked'
  },

  TENANT_STATUS: {
    ACTIVE: 'active',
    SUSPENDED: 'suspended'
  },

  USER_STATUS: {
    ACTIVE: 'active',
    SUSPENDED: 'suspended',
    DELETED: 'deleted'
  },

  SUBSCRIPTION_STATUS: {
    ACTIVE: 'active',
    EXPIRED: 'expired',
    TRIAL: 'trial',
    CANCELLED: 'cancelled'
  },

  FEE_TYPE: {
    DAILY: 'ngay',
    MONTHLY: 'thang'
  },

  TARGET_TYPE: {
    KIOSK: 'kiosk',
    ZONE: 'zone',
    KIOSK_TYPE: 'kiosk_type'
  },

  SHIFT_STATUS: {
    PENDING: 'pending',
    COMPLETED: 'completed',
    DISCREPANCY: 'discrepancy'
  },

  NOTIFICATION_TYPES: {
    PAYMENT_REMINDER: 'payment_reminder',
    SUBSCRIPTION_WARNING: 'subscription_warning',
    SUBSCRIPTION_EXPIRED: 'subscription_expired',
    SHIFT_REMINDER: 'shift_reminder',
    SYSTEM: 'system'
  }
};