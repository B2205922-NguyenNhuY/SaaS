// const { Op } = require('sequelize');
// const { User } = require('../models');

// class NotificationService {
//   static async createNotification({
//     tenant_id,
//     type,
//     title,
//     content,
//     target_users = 'all'
//   }) {
    
//     if (target_users === 'all') {
//       const users = await User.findAll({
//         where: {
//           tenant_id,
//           trangThai: 'active'
//         }
//       });
      
//       // Gửi notification cho từng user
//       users.forEach(user => {
//         console.log(`Sending to user ${user.user_id}: ${title}`);
//       });
//     }
//   }

//   static async sendPaymentReminder(tenant_id, charge) {
//     const merchant = await charge.getMerchant();
//     await this.createNotification({
//       tenant_id,
//       type: 'payment_reminder',
//       title: 'Nhắc thanh toán phí',
//       content: `Kỳ thu ${charge.period_id} - Số tiền: ${charge.soTienPhaiThu}`,
//       target_users: 'all'
//     });
//   }

//   static async sendSubscriptionExpiryWarning(tenant_id, daysLeft) {
//     await this.createNotification({
//       tenant_id,
//       type: 'subscription_warning',
//       title: 'Gói dịch vụ sắp hết hạn',
//       content: `Gói dịch vụ của bạn sẽ hết hạn sau ${daysLeft} ngày`,
//       target_users: 'admin_only'
//     });
//   }
// }

// module.exports = NotificationService;