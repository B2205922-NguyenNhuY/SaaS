const db = require("../config/db");

exports.createAuditLog = async (...args) => {
  const connection = args.length === 2 ? args[0] : db;
  const data = args.length === 2 ? args[1] : args[0];
  const { tenant_id, user_id, super_admin_id, hanhDong, entity_type, entity_id, giaTriCu, giaTriMoi } = data;
  const [result] = await connection.execute(
    `INSERT INTO audit_log
      (tenant_id, user_id, super_admin_id, hanhDong, entity_type, entity_id, giaTriCu, giaTriMoi, ip_address)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [tenant_id||null, user_id||null, super_admin_id||null, hanhDong,
     entity_type||null, entity_id ? Number(entity_id) : null,
     giaTriCu ? JSON.stringify(giaTriCu) : null,
     giaTriMoi ? JSON.stringify(giaTriMoi) : null,
     data.ip_address||null]
  );
  return result;
};

exports.count = async (whereSQL, params) => {
  const [[{ total }]] = await db.query(
    `SELECT COUNT(*) total FROM audit_log WHERE ${whereSQL}`, params
  );
  return total;
};

exports.list = async (whereSQL, params, limit, offset) => {
  const [rows] = await db.query(
    `SELECT al.*,
      COALESCE(sa.hoTen, u.hoTen) as performer_name,
      COALESCE(sa.email, u.email) as performer_email,
      CASE
        WHEN al.super_admin_id IS NOT NULL THEN 'Super Admin'
        WHEN u.role_id IS NOT NULL THEN r.tenVaiTro
        ELSE NULL
      END as performer_role
     FROM audit_log al
     LEFT JOIN super_admin sa ON sa.admin_id = al.super_admin_id
     LEFT JOIN users u ON u.user_id = al.user_id AND u.tenant_id = al.tenant_id
     LEFT JOIN role r ON r.role_id = u.role_id
     WHERE ${whereSQL}
     ORDER BY al.thoiGianThucHien DESC
     LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );
  return rows;
};