const db = require("../config/db");

exports.create = async (conn, { tenant_id, kiosk_id, merchant_id, ngayBatDau }) => {
  const [r] = await conn.query(
    `INSERT INTO kiosk_assignment
      (tenant_id, kiosk_id, merchant_id, ngayBatDau, trangThai)
     VALUES (?, ?, ?, ?, 'active')`,
    [tenant_id, kiosk_id, merchant_id, ngayBatDau]
  );

  return r.insertId;
};

exports.getActiveByKiosk = async (conn, tenant_id, kiosk_id) => {
  const [[row]] = await conn.query(
    `SELECT *
     FROM kiosk_assignment
     WHERE tenant_id = ?
       AND kiosk_id = ?
       AND trangThai = 'active'
     LIMIT 1`,
    [tenant_id, kiosk_id]
  );

  return row;
};

exports.endAssignment = async (conn, tenant_id, assignment_id, ngayKetThuc) => {
  const [r] = await conn.query(
    `UPDATE kiosk_assignment
     SET ngayKetThuc = ?, trangThai = 'ended'
     WHERE tenant_id = ? AND assignment_id = ?`,
    [ngayKetThuc, tenant_id, assignment_id]
  );

  return r.affectedRows;
};

exports.getById = async (conn, tenant_id, assignment_id) => {
    const connection = conn || db;

  const [[row]] = await connection.query(
    `SELECT *
     FROM kiosk_assignment
     WHERE tenant_id = ? AND assignment_id = ?`,
    [tenant_id, assignment_id]
  );

  return row;
};

exports.list = async (whereSQL, params, sort, order, limit, offset) => {
  const [rows] = await db.query(
    `SELECT ka.*,
            m.hoTen AS merchantName,
            m.soDienThoai,
            m.CCCD,
            k.maKiosk,
            k.viTri,
            z.tenKhu,
            mk.tenCho
     FROM kiosk_assignment ka
     JOIN merchant m ON m.merchant_id = ka.merchant_id AND m.tenant_id = ka.tenant_id
     JOIN kiosk k ON k.kiosk_id = ka.kiosk_id AND k.tenant_id = ka.tenant_id
     JOIN zone z ON z.zone_id = k.zone_id AND z.tenant_id = k.tenant_id
     JOIN market mk ON mk.market_id = z.market_id AND mk.tenant_id = z.tenant_id
     WHERE ${whereSQL}
     ORDER BY ${sort} ${order}
     LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );

  return rows;
};

exports.updateKioskStatus = async (conn, tenant_id, kiosk_id, status) => {
  await conn.query(
    `UPDATE kiosk
     SET trangThai = ?
     WHERE tenant_id = ? AND kiosk_id = ?`,
    [status, tenant_id, kiosk_id]
  );
};

exports.count = async (whereSQL, params) => {
  const [rows] = await db.query(
    `SELECT COUNT(*) total
     FROM kiosk_assignment ka
     WHERE ${whereSQL}`,
    params
  );

  return rows[0].total;
};