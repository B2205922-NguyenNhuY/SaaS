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

exports.countKiosks = async (tenant_id) => {
  const [[row]] = await db.query(
    `SELECT COUNT(*) AS total
     FROM kiosk
     WHERE tenant_id = ?`,
    [tenant_id]
  );
  return Number(row.total || 0);
};

exports.existsKioskCode = async (
  tenant_id,
  zone_id,
  maKiosk,
  excludeId = null
) => {

  const params = [tenant_id, zone_id, maKiosk];

  let sql = `
    SELECT kiosk_id
    FROM kiosk
    WHERE tenant_id = ?
    AND zone_id = ?
    AND maKiosk = ?
  `;

  if (excludeId) {
    sql += " AND kiosk_id <> ?";
    params.push(excludeId);
  }

  const [rows] = await db.query(sql + " LIMIT 1", params);

  return rows.length > 0;
};

exports.create = async (
  tenant_id,
  zone_id,
  type_id,
  maKiosk,
  viTri,
  dienTich
) => {

  const [r] = await db.query(
    `INSERT INTO kiosk
     (tenant_id, zone_id, type_id, maKiosk, viTri, dienTich, trangThai)
     VALUES (?, ?, ?, ?, ?, ?, 'available')`,
    [tenant_id, zone_id, type_id, maKiosk, viTri, dienTich]
  );

  return r.insertId;
};

exports.getCurrent = async (tenant_id, kiosk_id) => {

  const [rows] = await db.query(
    `SELECT zone_id, maKiosk
     FROM kiosk
     WHERE tenant_id = ?
     AND kiosk_id = ?
     LIMIT 1`,
    [tenant_id, kiosk_id]
  );

  return rows[0] || null;
};

exports.update = async (tenant_id, kiosk_id, sets, params) => {

  const [r] = await db.query(
    `UPDATE kiosk
     SET ${sets.join(", ")}
     WHERE tenant_id = ?
     AND kiosk_id = ?`,
    [...params, tenant_id, kiosk_id]
  );

  return r;
};

exports.updateStatus = async (tenant_id, kiosk_id, trangThai) => {

  const [r] = await db.query(
    `UPDATE kiosk
     SET trangThai = ?
     WHERE tenant_id = ?
     AND kiosk_id = ?`,
    [trangThai, tenant_id, kiosk_id]
  );

  return r.affectedRows;
};

exports.count = async (whereSQL, params) => {

  const [[row]] = await db.query(
    `SELECT COUNT(*) total
     FROM kiosk k
     WHERE ${whereSQL}`,
    params
  );

  return row.total;
};

exports.list = async (
  whereSQL,
  params,
  sort,
  order,
  limit,
  offset
) => {

  const [rows] = await db.query(
    `SELECT k.*, z.tenKhu, m.tenCho, kt.tenLoai
     FROM kiosk k
     JOIN zone z
       ON z.zone_id = k.zone_id
       AND z.tenant_id = k.tenant_id
     JOIN market m
       ON m.market_id = z.market_id
       AND m.tenant_id = z.tenant_id
     JOIN kiosk_type kt
       ON kt.type_id = k.type_id
     WHERE ${whereSQL}
     ORDER BY ${sort} ${order}
     LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );

  return rows;
};

exports.getDetail = async (tenant_id, kiosk_id) => {

  const [rows] = await db.query(
    `SELECT k.*, z.tenKhu, m.tenCho, kt.tenLoai
     FROM kiosk k
     JOIN zone z ON z.zone_id = k.zone_id AND z.tenant_id = k.tenant_id
     JOIN market m ON m.market_id = z.market_id AND m.tenant_id = z.tenant_id
     JOIN kiosk_type kt ON kt.type_id = k.type_id
     WHERE k.tenant_id = ?
     AND k.kiosk_id = ?
     LIMIT 1`,
    [tenant_id, kiosk_id]
  );

  return rows[0] || null;
};