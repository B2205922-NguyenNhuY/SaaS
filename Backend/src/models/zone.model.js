const db = require("../config/db");

exports.existsZoneName = async (tenant_id, market_id, tenKhu, excludeId = null) => {

  const params = [tenant_id, market_id, tenKhu];

  let sql = `
    SELECT zone_id
    FROM zone
    WHERE tenant_id = ?
    AND market_id = ?
    AND tenKhu = ?
  `;

  if (excludeId) {
    sql += " AND zone_id <> ?";
    params.push(excludeId);
  }

  const [rows] = await db.query(sql + " LIMIT 1", params);

  return rows.length > 0;
};

exports.create = async (tenant_id, market_id, tenKhu) => {

  const [r] = await db.query(
    `INSERT INTO zone (tenant_id, market_id, tenKhu, trangThai)
     VALUES (?, ?, ?, 'active')`,
    [tenant_id, market_id, tenKhu]
  );

  return r.insertId;
};


exports.update = async (tenant_id, zone_id, tenKhu, market_id) => {

  const [r] = await db.query(
    `UPDATE zone
     SET tenKhu = COALESCE(?, tenKhu),
         market_id = COALESCE(?, market_id)
     WHERE tenant_id = ?
     AND zone_id = ?`,
    [tenKhu, market_id, tenant_id, zone_id]
  );

  return r.affectedRows;
};

exports.updateStatus = async (tenant_id, zone_id, trangThai) => {

  const [r] = await db.query(
    `UPDATE zone
     SET trangThai = ?
     WHERE tenant_id = ?
     AND zone_id = ?`,
    [trangThai, tenant_id, zone_id]
  );

  return r.affectedRows;
};

exports.count = async (whereSQL, params) => {

  const [[row]] = await db.query(
    `SELECT COUNT(*) total
     FROM zone z
     WHERE ${whereSQL}`,
    params
  );

  return row.total;
};

exports.list = async (whereSQL, params, sort, order, limit, offset) => {

  const [rows] = await db.query(
    `SELECT z.*, m.tenCho
     FROM zone z
     JOIN market m
       ON m.market_id = z.market_id
       AND m.tenant_id = z.tenant_id
     WHERE ${whereSQL}
     ORDER BY ${sort} ${order}
     LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );

  return rows;
};

exports.getById = async (tenant_id, zone_id) => {
  const [rows] = await db.query(
    `SELECT 
        z.*, 
        m.tenCho
     FROM zone z
     JOIN market m 
        ON m.market_id = z.market_id 
        AND m.tenant_id = z.tenant_id
     WHERE z.tenant_id = ? 
       AND z.zone_id = ?
     LIMIT 1`,
    [tenant_id, zone_id]
  );

  return rows[0] || null;
};