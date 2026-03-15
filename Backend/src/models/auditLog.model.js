const db = require("../config/db");

// Tạo audit log
exports.createAuditLog = async (...args) => {
    const connection = args.length === 2 ? args[0] : db;
  const data = args.length === 2 ? args[1] : args[0];

    const {
        tenant_id,
        user_id,
        super_admin_id,
        hanhDong,
        entity_type,
        entity_id,
        giaTriCu,
        giaTriMoi
    } = data;

    const [result] = await connection.execute(
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
            giaTriMoi ? JSON.stringify(giaTriMoi) : null
        ]
    );

    return result;
};


// Lấy audit log theo tenant
exports.getAuditLogsByTenant = async (tenant_id) => {

    const [rows] = await db.execute(
        `SELECT *
         FROM audit_log
         WHERE tenant_id = ?
         ORDER BY thoiGianThucHien DESC`,
        [tenant_id]
    );

    return rows;
};


// Lấy audit log theo entity
exports.getAuditLogsByEntity = async (entity_type, entity_id) => {

    const [rows] = await db.execute(
        `SELECT *
         FROM audit_log
         WHERE entity_type = ?
         AND entity_id = ?
         ORDER BY thoiGianThucHien DESC`,
        [entity_type, entity_id]
    );

    return rows;
};

exports.count = async (whereSQL, params) => {
  const [[{ total }]] = await db.query(
    `SELECT COUNT(*) total
     FROM audit_log
     WHERE ${whereSQL}`,
    params
  );

  return total;
};

exports.list = async (whereSQL, params, limit, offset) => {
  const [rows] = await db.query(
    `SELECT *
     FROM audit_log
     WHERE ${whereSQL}
     ORDER BY thoiGianThucHien DESC
     LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );

  return rows;
};