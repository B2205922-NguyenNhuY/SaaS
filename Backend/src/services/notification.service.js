const notificationModel = require("../models/notification.model");
const auditLogModel = require("../models/auditLog.model");
const admin = require('firebase-admin');


exports.sendPushToMerchantTopic = async (merchantId, title, body) => {
    const message = {
        notification: { title, body },
        data: {
            screen: 'debt_screen', // Logic GoRouter của bạn sẽ bắt chữ này
        },
        // Gửi tới topic thay vì token
        topic: `merchant_${merchantId}` 
    };

    try {
        await admin.messaging().send(message);
        console.log(`✅ Đã gửi Push tới topic merchant_${merchantId}`);
    } catch (error) {
        console.error("❌ Lỗi gửi Push Topic:", error);
    }
};

exports.createNotification = async (data, user) => {
  const isSuperAdmin = !user.tenant_id;
  const result = await notificationModel.createNotification({
    tenant_id: isSuperAdmin ? (data.tenant_id ?? null) : user.tenant_id,
    title: data.title,
    content: data.content,
    type: data.type || (isSuperAdmin ? "system" : "tenant"),
    created_by_tenantadmin: isSuperAdmin ? null : user.id,
    created_by_superadmin: isSuperAdmin ? user.id : null,
    expires_at: data.expires_at,
  });

  await auditLogModel.createAuditLog({
    tenant_id: user.tenant_id,
    user_id: user.id,
    hanhDong: "CREATE_NOTIFICATION",
    entity_type: "notification",
    entity_id: result.insertId,
    giaTriMoi: data,
  });

  return result;
};

exports.getNotifications = async (user) => {
  return await notificationModel.getNotifications(user.tenant_id, user.id);
};

exports.getMyNotifications = async (user) => {
  return await notificationModel.getMyNotifications(user.tenant_id, user.id);
};

exports.getUnreadCount = async (user) => {
  return await notificationModel.getUnreadCount(user.tenant_id, user.id);
};

exports.markAsRead = async (notification_id, user) => {
  const role = user.role === "merchant" ? "merchant" : "user";
  const result = await notificationModel.markAsRead(
    notification_id,
    user.id,
    user.tenant_id,
    role
  );

  await auditLogModel.createAuditLog({
    tenant_id: user.tenant_id,
    user_id: user.id,
    hanhDong: "READ_NOTIFICATION",
    entity_type: "notification",
    entity_id: notification_id,
  });

  return result;
};

exports.getNotificationDetail = async (notification_id, user) => {
  const notification = await notificationModel.getNotificationById(
    notification_id,
    user.tenant_id,
    user.id,
  );

  if (!notification) {
    throw new Error("Notification not found");
  }

  if (!notification.is_read) {
    await notificationModel.markAsRead(
      notification_id,
      user.id,
      user.tenant_id,
    );

    notification.is_read = 1;
  }

  return notification;
};
