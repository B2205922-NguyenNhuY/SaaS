const notificationModel = require("../models/notification.model");
const auditLogModel = require("../models/auditLog.model");
const db = require("../config/db");

async function getUserMarketIds(user_id, tenant_id) {
  const [rows] = await db.execute(
    `SELECT DISTINCT m.market_id
     FROM market m
     JOIN zone z ON z.market_id = m.market_id AND z.tenant_id = m.tenant_id
     JOIN kiosk k ON k.zone_id = z.zone_id AND k.tenant_id = z.tenant_id
     WHERE m.tenant_id = ?`,
    [tenant_id],
  );
  return rows.map((r) => r.market_id);
}

exports.createNotification = async (data, user) => {
  const isSuperAdmin = user.role === "super_admin";

  const payload = {
    tenant_id: null,
    market_id: data.market_id ? Number(data.market_id) : null,
    zone_id: data.zone_id ? Number(data.zone_id) : null,
    target_role: data.target_role || null,
    title: data.title || null,
    content: data.content || null,
    type: null,
    created_by_tenantadmin: null,
    created_by_superadmin: null,
    expires_at: data.expires_at || null,
  };

  if (!payload.title || !payload.content) {
    throw Object.assign(new Error("Tiêu đề và nội dung không được để trống"), {
      statusCode: 400,
    });
  }

  if (isSuperAdmin) {
    payload.type = data.tenant_id ? "tenant" : "system";
    payload.tenant_id = data.tenant_id ? Number(data.tenant_id) : null;
    payload.created_by_superadmin = user.id;
  } else {
    payload.type = "tenant";
    payload.tenant_id = user.tenant_id;
    payload.created_by_tenantadmin = user.id;
  }

  const result = await notificationModel.createNotification(payload);

  await auditLogModel.createAuditLog({
    tenant_id: user.tenant_id || null,
    user_id: isSuperAdmin ? null : user.id,
    super_admin_id: isSuperAdmin ? user.id : null,
    hanhDong: "CREATE_NOTIFICATION",
    entity_type: "notification",
    entity_id: result.insertId,
    giaTriMoi: payload,
  });

  return result;
};

exports.getNotifications = async (user, pagination) => {
  const isSuperAdmin = user.role === "super_admin";

  if (isSuperAdmin) {
    return await notificationModel.getAllNotifications(
      pagination.page,
      pagination.limit,
    );
  }
  let market_ids = [];
  if (user.role === "merchant" || user.role === "collector") {
    market_ids = await getUserMarketIds(user.id, user.tenant_id);
  }

  const rows = await notificationModel.getNotificationsForUser({
    user_id: user.id,
    tenant_id: user.tenant_id,
    role: user.role,
    market_ids,
  });

  return {
    rows,
    total: rows.length,
  };
};

exports.getUnreadCount = async (user) => {
  const isSuperAdmin = user.role === "super_admin";

  if (isSuperAdmin) {
    const [[row]] = await db.execute(
      `SELECT COUNT(*) as unread_count FROM notification`,
    );
    return row;
  }

  let market_ids = [];
  if (user.role === "merchant" || user.role === "collector") {
    market_ids = await getUserMarketIds(user.id, user.tenant_id);
  }

  return await notificationModel.getUnreadCount({
    user_id: user.id,
    tenant_id: user.tenant_id,
    role: user.role,
    market_ids,
  });
};

exports.markAsRead = async (notification_id, user) => {
  if (user.role === "super_admin") return { message: "ok" };

  const result = await notificationModel.markAsRead(
    notification_id,
    user.id,
    user.tenant_id,
  );

  await auditLogModel.createAuditLog({
    tenant_id: user.tenant_id || null,
    user_id: user.id,
    hanhDong: "READ_NOTIFICATION",
    entity_type: "notification",
    entity_id: notification_id,
  });

  return result;
};

exports.getNotificationDetail = async (notification_id, user) => {
  const notification =
    await notificationModel.getNotificationById(notification_id);

  if (!notification) {
    throw Object.assign(new Error("Notification not found"), {
      statusCode: 404,
    });
  }

  if (user.role !== "super_admin" && !notification.is_read) {
    await notificationModel.markAsRead(
      notification_id,
      user.id,
      user.tenant_id,
    );
    notification.is_read = 1;
  }

  const stats = await notificationModel.getReadStats(notification_id);
  if (stats) {
    notification.doc_count = stats.doc_count || 0;
    notification.tong_nguoi_nhan = stats.tong_nguoi_nhan || 0;
  }

  return notification;
};
