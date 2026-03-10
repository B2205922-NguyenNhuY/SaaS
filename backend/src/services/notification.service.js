const notificationModel = require("../models/notification.model");
const auditLogModel = require("../models/auditLog.model");


exports.createNotification = async (data, user) => {

    const result = await notificationModel.createNotification({
        tenant_id: user.tenant_id,
        title: data.title,
        content: data.content,
        type: "tenant",
        created_by_tenantadmin: user.id,
        created_by_superadmin: null,
        expires_at: data.expires_at
    });

    await auditLogModel.createAuditLog({
        tenant_id: user.tenant_id,
        user_id: user.id,
        hanhDong: "CREATE_NOTIFICATION",
        entity_type: "notification",
        entity_id: result.insertId,
        giaTriMoi: data
    });

    return result;
};


exports.getNotifications = async (user) => {

    return await notificationModel.getNotifications(
        user.tenant_id,
        user.id
    );
};


exports.getUnreadCount = async (user) => {

    return await notificationModel.getUnreadCount(
        user.tenant_id,
        user.id
    );
};


exports.markAsRead = async (notification_id, user) => {

    const result = await notificationModel.markAsRead(
        notification_id,
        user.id,
        user.tenant_id
    );

    await auditLogModel.createAuditLog({
        tenant_id: user.tenant_id,
        user_id: user.id,
        hanhDong: "READ_NOTIFICATION",
        entity_type: "notification",
        entity_id: notification_id
    });

    return result;
};


exports.getNotificationDetail = async (notification_id, user) => {

    const notification = await notificationModel.getNotificationById(
        notification_id,
        user.tenant_id,
        user.id
    );

    if (!notification) {
        throw new Error("Notification not found");
    }

    if (!notification.is_read) {

        await notificationModel.markAsRead(
            notification_id,
            user.id,
            user.tenant_id
        );

        notification.is_read = 1;
    }

    return notification;
};