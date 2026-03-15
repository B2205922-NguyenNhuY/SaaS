const db = require("../config/database");

// Tạo audit log
exports.createAuditLog = async (data) => {
  if (!data) {
    console.error("Audit log data is undefined");
    return null;
  }

  const {
    tenant_id,
    user_id,
    super_admin_id,
    hanhDong,
    entity_type,
    entity_id,
    giaTriCu,
    giaTriMoi,
  } = data;

  if (!hanhDong) {
    console.error("hanhDong is required for audit log");
    return null;
  }

  const [result] = await db.execute(
    `INSERT INTO audit_log 
        (tenant_id, user_id, super_admin_id, hanhDong, entity_type, entity_id, giaTriCu, giaTriMoi)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      tenant_id || null,
      user_id || null,
      super_admin_id || null,
      hanhDong,
      entity_type || null,
      entity_id || null,
      giaTriCu ? JSON.stringify(giaTriCu) : null,
      giaTriMoi ? JSON.stringify(giaTriMoi) : null,
    ],
  );

  return result;
};

// Lấy audit log theo super admin
exports.getAuditLogsBySuperAdmin = async (super_admin_id) => {
  const [rows] = await db.execute(
    `SELECT *
         FROM audit_log
         WHERE super_admin_id = ?
         ORDER BY thoiGianThucHien DESC`,
    [super_admin_id],
  );

  return rows;
};

// Lấy audit log theo tenant
exports.getAuditLogsByTenant = async (tenant_id) => {
  const [rows] = await db.execute(
    `
        SELECT 
            al.*,
            u.hoTen
        FROM audit_log al
        LEFT JOIN users u
            ON al.user_id = u.user_id
            AND u.tenant_id = al.tenant_id
        WHERE al.tenant_id = ?
        ORDER BY al.thoiGianThucHien DESC
        `,
    [tenant_id],
  );

  return rows;
};

// Lấy audit log theo entity
exports.getAuditLogsByEntity = async (entity_type, entity_id, tenant_id) => {
  const [rows] = await db.execute(
    `
        SELECT *
        FROM audit_log
        WHERE entity_type = ?
        AND entity_id = ?
        AND tenant_id = ?
        ORDER BY thoiGianThucHien DESC
        `,
    [entity_type, entity_id, tenant_id],
  );

  return rows;
};
