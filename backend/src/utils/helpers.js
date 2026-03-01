const moment = require('moment');

module.exports = {
  // Generate unique code
  generateCode: (prefix, length = 8) => {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 2 + length);
    return `${prefix}_${timestamp}_${random}`.toUpperCase();
  },

  // Format currency
  formatCurrency: (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  },

  // Calculate date range
  getDateRange: (type, date = new Date()) => {
    const start = moment(date).startOf(type);
    const end = moment(date).endOf(type);
    return {
      start: start.toDate(),
      end: end.toDate()
    };
  },

  // Pagination helper
  getPagination: (page, size) => {
    const limit = size ? +size : 10;
    const offset = page ? (page - 1) * limit : 0;
    return { limit, offset };
  },

  // Get paginated data
  getPagingData: (data, page, limit) => {
    const { count: totalItems, rows } = data;
    const currentPage = page ? +page : 1;
    const totalPages = Math.ceil(totalItems / limit);
    return { totalItems, rows, totalPages, currentPage };
  },

  // Validate dates
  isValidDate: (date) => {
    return moment(date).isValid();
  },

  // Compare dates
  isDateBetween: (date, start, end) => {
    const d = moment(date);
    return d.isBetween(start, end, 'day', '[]');
  },

  // Generate random password
  generatePassword: (length = 8) => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < length; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  },

  // Mask sensitive data
  maskEmail: (email) => {
    const [local, domain] = email.split('@');
    const maskedLocal = local.charAt(0) + '*'.repeat(local.length - 2) + local.charAt(local.length - 1);
    return `${maskedLocal}@${domain}`;
  },

  maskPhone: (phone) => {
    return phone.replace(/(\d{3})\d{4}(\d{3})/, '$1****$2');
  },

  // Deep clone object
  deepClone: (obj) => {
    return JSON.parse(JSON.stringify(obj));
  },

  // Check if object is empty
  isEmptyObject: (obj) => {
    return Object.keys(obj).length === 0 && obj.constructor === Object;
  },

  // Delay execution
  delay: (ms) => {
    return new Promise(resolve => setTimeout(resolve, ms));
  },

  // Retry function
  retry: async (fn, maxAttempts = 3, delay = 1000) => {
    for (let i = 0; i < maxAttempts; i++) {
      try {
        return await fn();
      } catch (error) {
        if (i === maxAttempts - 1) throw error;
        await module.exports.delay(delay);
      }
    }
  }
};