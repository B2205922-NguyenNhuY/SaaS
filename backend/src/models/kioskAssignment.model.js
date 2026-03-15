const db = require("../config/database");

exports.create = async ({ tenant_id, kiosk_id, merchant_id, ngayBatDau }) => {
  const [result] = await db.execute(
    `INSERT INTO kiosk_assignment
      (tenant_id, kiosk_id, merchant_id, ngayBatDau, trangThai)
     VALUES (?, ?, ?, ?, 'active')`,
    [tenant_id, kiosk_id, merchant_id, ngayBatDau],
  );
  return result;
};

exports.list = async ({ tenant_id, limit, offset }) => {
  const [rows] = await db.execute(
    `SELECT ka.*, 
            k.maKiosk,
            m.hoTen AS merchantName
     FROM kiosk_assignment ka
     LEFT JOIN kiosk k ON ka.kiosk_id = k.kiosk_id
     LEFT JOIN merchant m ON ka.merchant_id = m.merchant_id
     WHERE ka.tenant_id = ?
     ORDER BY ka.assignment_id DESC
     LIMIT ? OFFSET ?`,
    [tenant_id, Number(limit), Number(offset)],
  );
  return rows;
};

exports.count = async ({ tenant_id }) => {
  const [rows] = await db.execute(
    `SELECT COUNT(*) AS total
     FROM kiosk_assignment
     WHERE tenant_id = ?`,
    [tenant_id],
  );
  return rows[0]?.total || 0;
};

exports.getById = async (id) => {
  const [rows] = await db.execute(
    `SELECT ka.*, 
            k.maKiosk,
            m.hoTen AS merchantName
     FROM kiosk_assignment ka
     LEFT JOIN kiosk k ON ka.kiosk_id = k.kiosk_id
     LEFT JOIN merchant m ON ka.merchant_id = m.merchant_id
     WHERE ka.assignment_id = ?
     LIMIT 1`,
    [id],
  );
  return rows[0];
};

exports.getActiveByKiosk = async (tenant_id, kiosk_id) => {
  const [rows] = await db.execute(
    `SELECT *
     FROM kiosk_assignment
     WHERE tenant_id = ?
       AND kiosk_id = ?
       AND trangThai = 'active'
     LIMIT 1`,
    [tenant_id, kiosk_id],
  );
  return rows[0];
};

exports.endAssignment = async (id) => {
  const [result] = await db.execute(
    `UPDATE kiosk_assignment
     SET trangThai = 'ended',
         ngayKetThuc = CURDATE(),
         updated_at = CURRENT_TIMESTAMP
     WHERE assignment_id = ?
       AND trangThai = 'active'`,
    [id],
  );
  return result;
};
