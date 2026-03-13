const db = require("../config/database");
const auditLogModel = require("../models/auditLog.model");


// Tạo notification
exports.createNotification = async (data) => {

    const {
        tenant_id,
        title,
        content,
        type,
        created_by_tenantadmin,
        created_by_superadmin,
        expires_at
    } = data;

    const [result] = await db.execute(
        `INSERT INTO notification
        (tenant_id, title, content, type, created_by_tenantadmin, created_by_superadmin, expires_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
            tenant_id,
            title,
            content,
            type,
            created_by_tenantadmin,
            created_by_superadmin,
            expires_at
        ]
    );

    return result;
};


// Lấy notifications theo user
exports.getNotifications = async (tenant_id, user_id) => {
    const [rows] = await db.execute(
        `SELECT n.*,
        CASE WHEN nr.user_id IS NULL THEN 0 ELSE 1 END as is_read
        FROM notification n
        LEFT JOIN notification_read nr
        ON n.notification_id = nr.notification_id
        AND nr.user_id = ?
        AND nr.tenant_id = n.tenant_id
        WHERE (n.tenant_id = ? OR n.type = 'system')
        AND (n.expires_at IS NULL OR n.expires_at > NOW())
        ORDER BY n.created_at DESC`,
        [user_id, tenant_id]  
    );
    return rows;
};


// Đánh dấu notification đã đọc
exports.markAsRead = async (notification_id, user_id, tenant_id) => {
    const [result] = await db.execute(
        `INSERT INTO notification_read (notification_id, user_id, tenant_id)
         VALUES (?, ?, ?)`,
        [notification_id, user_id, tenant_id]
    );
    return result;
};


// Lấy notifications chưa đọc
exports.getUnreadNotifications = async (tenant_id, user_id) => {

    const [rows] = await db.execute(
        `SELECT n.*
        FROM notification n
        LEFT JOIN notification_read nr
        ON n.notification_id = nr.notification_id
        AND nr.user_id = ?

        WHERE nr.user_id IS NULL
        AND (n.tenant_id = ? OR n.type='system')

        ORDER BY n.created_at DESC`,
        [user_id, tenant_id]
    );

    return rows;
};


// Xem chi tiết notification
exports.getNotificationById = async (notification_id, tenant_id, user_id) => {
    const [rows] = await db.execute(
        `SELECT 
            n.*,
            CASE WHEN nr.user_id IS NULL THEN 0 ELSE 1 END AS is_read
        FROM notification n
        LEFT JOIN notification_read nr
            ON n.notification_id = nr.notification_id
            AND nr.user_id = ?
        WHERE n.notification_id = ?
            AND (n.tenant_id = ? OR n.type = 'system')
        LIMIT 1`,
        [user_id, notification_id, tenant_id]
    );
    return rows[0];
};


// Lấy số lượng notification chưa đọc
exports.getUnreadCount = async (tenant_id, user_id) => {
    const [rows] = await db.execute(
        `SELECT COUNT(*) as unread_count
        FROM notification n
        LEFT JOIN notification_read nr
            ON n.notification_id = nr.notification_id
            AND nr.user_id = ?
        WHERE nr.user_id IS NULL
            AND (n.tenant_id = ? OR n.type = 'system')
            AND (n.expires_at IS NULL OR n.expires_at > NOW())`,
        [user_id, tenant_id]
    );
    return rows[0]; 
};