const db = require("../config/db");

exports.getCurrentPlan = async (tenant_id) => {
  const [rows] = await db.query(
    `SELECT p.*
     FROM plan_subscription ps
     JOIN plan p ON ps.plan_id = p.plan_id
     WHERE ps.tenant_id = ?
     AND ps.trangThai = 'active'
     AND ps.ngayKetThuc > NOW()
     ORDER BY ps.subscription_id DESC
     LIMIT 1`,
    [tenant_id]
  );

  return rows[0] || null;
};

exports.countMarkets = async (tenant_id) => {
  const [[row]] = await db.query(
    `SELECT COUNT(*) AS total
     FROM market
     WHERE tenant_id = ?`,
    [tenant_id]
  );

  return Number(row.total || 0);
};

exports.existsName = async (tenant_id, tenCho, excludeId = null) => {
  const params = [tenant_id, tenCho];

  let sql = `SELECT market_id FROM market
             WHERE tenant_id = ? AND tenCho = ?`;

  if (excludeId) {
    sql += ` AND market_id <> ?`;
    params.push(excludeId);
  }

  const [rows] = await db.query(sql + " LIMIT 1", params);

  return rows.length > 0;
};

exports.create = async (tenant_id, data) => {
  const [r] = await db.query(
    `INSERT INTO market (tenant_id, tenCho, diaChi, dienTich, trangThai)
     VALUES (?, ?, ?, ?, 'active')`,
    [tenant_id, data.tenCho, data.diaChi, data.dienTich]
  );

  return r.insertId;
};

exports.update = async (tenant_id, market_id, data) => {
  const [r] = await db.query(
    `UPDATE market
     SET tenCho = COALESCE(?, tenCho),
         diaChi = COALESCE(?, diaChi),
         dienTich = COALESCE(?, dienTich)
     WHERE tenant_id = ? AND market_id = ?`,
    [
      data.tenCho,
      data.diaChi,
      data.dienTich,
      tenant_id,
      market_id
    ]
  );

  return r.affectedRows;
};

exports.updateStatus = async (tenant_id, market_id, trangThai) => {
  const [r] = await db.query(
    `UPDATE market
     SET trangThai = ?
     WHERE tenant_id = ? AND market_id = ?`,
    [trangThai, tenant_id, market_id]
  );

  return r.affectedRows;
};

exports.count = async (where, params) => {
  const [[row]] = await db.query(
    `SELECT COUNT(*) AS total
     FROM market m
     WHERE ${where}`,
    params
  );

  return row.total;
};

exports.list = async (where, params, sort, order, limit, offset) => {
  const [rows] = await db.query(
    `SELECT m.*
     FROM market m
     WHERE ${where}
     ORDER BY ${sort} ${order}
     LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );

  return rows;
};

exports.getById = async (tenant_id, market_id) => {

  const [rows] = await db.query(
    `SELECT * 
     FROM market 
     WHERE tenant_id = ? AND market_id = ?
     LIMIT 1`,
    [tenant_id, market_id]
  );

  return rows[0] || null;

};