const db = require("../config/db");

exports.createNotification = async (data) => {
  const {
    tenant_id = null,
    market_id = null,
    zone_id = null,
    target_role = null,
    title,
    content,
    type,
    created_by_tenantadmin = null,
    created_by_superadmin = null,
    expires_at = null,
  } = data;

  const [result] = await db.execute(
    `INSERT INTO notification
      (tenant_id, market_id, zone_id, target_role, title, content, type,
       created_by_tenantadmin, created_by_superadmin, expires_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [tenant_id, market_id, zone_id, target_role, title, content, type,
     created_by_tenantadmin, created_by_superadmin, expires_at]
  );
  return result;
};

exports.autocreateNotification = async (
  tenant_id,
  merchant_id,
  title,
  content,
  type) => {

  const [result] = await db.execute(
    `INSERT INTO notification
        (tenant_id, target_merchant_id, title, content, type, expires_at)
        VALUES (?, ?, ?, ?, ?, DATE_ADD(NOW(), INTERVAL 30 DAY))`,
    [
      tenant_id,
      merchant_id,
      title,
      content,
      type
    ],
  );

  return result;
};



exports.getNotificationsForUser = async ({ user_id, tenant_id, role, market_ids = [] }) => {
  const conditions = [];
  const params = [user_id];

  conditions.push(`(
    (n.type = 'system' AND n.tenant_id IS NULL AND n.target_role IS NULL)
    OR (n.type = 'system' AND n.tenant_id IS NULL AND n.target_role = ?)
    OR (n.tenant_id = ? AND n.market_id IS NULL AND n.zone_id IS NULL AND (n.target_role IS NULL OR n.target_role = ?))
    ${market_ids.length > 0 ? `OR (n.market_id IN (${market_ids.map(() => '?').join(',')}) AND (n.target_role IS NULL OR n.target_role = ?))` : ''}
  )`);

  params.push(role, tenant_id, role);
  if (market_ids.length > 0) {
    params.push(...market_ids, role);
  }

  const [rows] = await db.execute(
    `SELECT n.*,
      CASE WHEN nr.user_id IS NULL THEN 0 ELSE 1 END as is_read
     FROM notification n
     LEFT JOIN notification_read nr
       ON n.notification_id = nr.notification_id AND nr.user_id = ?
     WHERE ${conditions.join(' AND ')}
       AND (n.expires_at IS NULL OR n.expires_at > NOW())
     ORDER BY n.created_at DESC`,
    params
  );
  return rows;
};

exports.getMyNotifications = async (tenant_id, user_id) => {
  const [rows] = await db.execute(
    `SELECT n.*,
        CASE WHEN nr.user_id IS NULL THEN 0 ELSE 1 END as is_read
        FROM notification n
        LEFT JOIN notification_read nr
        ON n.notification_id = nr.notification_id
        AND nr.user_id = ?
        AND nr.tenant_id = n.tenant_id
        WHERE (n.tenant_id = ? OR n.target_merchant_id = ?)
        AND (n.expires_at IS NULL OR n.expires_at > NOW())
        ORDER BY n.created_at DESC`,
    [user_id, tenant_id, user_id],
  );
  console.log(rows);
  return rows;
};


exports.getAllNotifications = async (page = 1, limit = 15) => {
  const offset = (page - 1) * limit;
  const [rows] = await db.execute(
    `SELECT n.*,
      sa.hoTen as created_by_super_name,
      u.hoTen as created_by_tenant_name,
      t.tenBanQuanLy as tenant_name
     FROM notification n
     LEFT JOIN super_admin sa ON sa.admin_id = n.created_by_superadmin
     LEFT JOIN users u ON u.user_id = n.created_by_tenantadmin
     LEFT JOIN tenant t ON t.tenant_id = n.tenant_id
     ORDER BY n.created_at DESC
     LIMIT ? OFFSET ?`,
    [limit, offset]
  );
  const [[{ total }]] = await db.execute(`SELECT COUNT(*) as total FROM notification`);
  return { rows, total };
};

exports.markAsRead = async (notification_id, user_id, tenant_id, type) => {
  console.log("type", type);
  const [result] = await db.execute(
    `INSERT IGNORE INTO notification_read (notification_id, user_id, tenant_id, type) VALUES (?, ?, ?, ?)`,
    [notification_id, user_id, tenant_id, type]
  );
  return result;
};

exports.getUnreadCount = async ({ user_id, tenant_id, role, market_ids = [] }) => {
  const params = [user_id, user_id];
  let marketCondition = '';
  if (market_ids.length > 0) {
    marketCondition = `OR (n.market_id IN (${market_ids.map(() => '?').join(',')}) AND (n.target_role IS NULL OR n.target_role = ?))`;
    params.push(...market_ids, role);
  }

  const [rows] = await db.execute(
    `SELECT COUNT(*) as unread_count
     FROM notification n
     LEFT JOIN notification_read nr
       ON n.notification_id = nr.notification_id AND nr.user_id = ?
     WHERE nr.user_id IS NULL
       AND (
         (n.type = 'system' AND n.tenant_id IS NULL AND n.target_role IS NULL)
         OR (n.type = 'system' AND n.tenant_id IS NULL AND n.target_role = ?)
         OR (n.tenant_id = ? AND n.market_id IS NULL AND n.zone_id IS NULL AND (n.target_role IS NULL OR n.target_role = ?))
         ${marketCondition}
       )
       AND (n.expires_at IS NULL OR n.expires_at > NOW())`,
    [user_id, role, tenant_id, role, ...params.slice(2)]
  );
  return rows[0];
};

exports.getNotificationById = async (notification_id) => {
  const [rows] = await db.execute(
    `SELECT n.*, t.tenBanQuanLy as tenant_name
     FROM notification n
     LEFT JOIN tenant t ON t.tenant_id = n.tenant_id
     WHERE n.notification_id = ? LIMIT 1`,
    [notification_id]
  );
  return rows[0];
};

exports.getReadStats = async (notification_id) => {
  const [[stats]] = await db.execute(
    `SELECT
      n.notification_id,
      n.tenant_id,
      n.market_id,
      n.zone_id,
      n.target_role,
      n.type,
      COUNT(DISTINCT nr.user_id) as doc_count,
      (
        SELECT COUNT(*)
        FROM users u
        WHERE u.trangThai = 'active'
          AND (
            n.tenant_id IS NULL
            OR u.tenant_id = n.tenant_id
          )
          AND (
            n.target_role IS NULL
            OR (
              SELECT r.tenVaiTro FROM role r WHERE r.role_id = u.role_id
            ) = n.target_role
          )
      ) as tong_nguoi_nhan
     FROM notification n
     LEFT JOIN notification_read nr ON nr.notification_id = n.notification_id
     WHERE n.notification_id = ?
     GROUP BY n.notification_id`,
    [notification_id]
  );
  return stats;
};

exports.getUserMarketIds = async (user_id, tenant_id) => {
  // 🔥 1. merchant → kiosk → zone → market
  const [merchantMarkets] = await db.query(
    `
    SELECT DISTINCT z.market_id
    FROM merchant m
    JOIN kiosk k 
      ON k.kiosk_id = m.kiosk_id 
     AND k.tenant_id = m.tenant_id
    JOIN zone z
      ON z.zone_id = k.zone_id
     AND z.tenant_id = k.tenant_id
    WHERE m.merchant_id = ?
      AND m.tenant_id = ?
      AND z.market_id IS NOT NULL
    `,
    [user_id, tenant_id]
  );

  if (merchantMarkets.length > 0) {
    return merchantMarkets.map(row => row.market_id);
  }

  // 🔥 2. collector
  const [collectorMarkets] = await db.query(
    `
    SELECT DISTINCT market_id
    FROM collector_market
    WHERE user_id = ?
      AND tenant_id = ?
    `,
    [user_id, tenant_id]
  );

  return collectorMarkets.map(row => row.market_id);
};