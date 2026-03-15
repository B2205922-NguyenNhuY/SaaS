const db = require("../config/db");

exports.create = async (
  tenant_id,
  password_hash,
  hoTen,
  soDienThoai,
  CCCD,
  maSoThue,
  diaChiThuongTru,
  ngayThamGiaKinhDoanh
) => {

  const [r] = await db.query(
    `INSERT INTO merchant
     (tenant_id, password_hash, hoTen, soDienThoai, CCCD, maSoThue, diaChiThuongTru, ngayThamGiaKinhDoanh, trangThai)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active')`,
    [
      tenant_id,
      password_hash,
      hoTen,
      soDienThoai,
      CCCD,
      maSoThue,
      diaChiThuongTru,
      ngayThamGiaKinhDoanh,
    ]
  );

  return r.insertId;
};

exports.update = async (
  tenant_id,
  password_hash,
  merchant_id,
  hoTen,
  soDienThoai,
  maSoThue,
  diaChiThuongTru,
  ngayThamGiaKinhDoanh,
  trangThai
) => {

  const [r] = await db.query(
    `UPDATE merchant
     SET hoTen = COALESCE(?, hoTen),
         soDienThoai = COALESCE(?, soDienThoai),
         maSoThue = COALESCE(?, maSoThue),
         diaChiThuongTru = COALESCE(?, diaChiThuongTru),
         ngayThamGiaKinhDoanh = COALESCE(?, ngayThamGiaKinhDoanh),
         trangThai = COALESCE(?, trangThai),
         inactive_at = CASE
            WHEN ? = 'inactive' THEN NOW()
            ELSE inactive_at
         END
     WHERE tenant_id = ?
     AND merchant_id = ?`,
    [
      hoTen,
      soDienThoai,
      maSoThue,
      diaChiThuongTru,
      ngayThamGiaKinhDoanh,
      trangThai,
      trangThai,
      tenant_id,
      merchant_id,
    ]
  );

  return r.affectedRows;
};

exports.count = async (whereSQL, params) => {

  const [[row]] = await db.query(
    `SELECT COUNT(*) total
     FROM merchant m
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
    `SELECT m.*
     FROM merchant m
     WHERE ${whereSQL}
     ORDER BY ${sort} ${order}
     LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );

  return rows;
};

exports.getById = async (tenant_id, merchant_id) => {

  const [rows] = await db.query(
    `SELECT *
     FROM merchant
     WHERE tenant_id = ?
     AND merchant_id = ?
     LIMIT 1`,
    [tenant_id, merchant_id]
  );

  return rows[0] || null;
};

exports.getActiveAssignments = async (tenant_id, merchant_id) => {

  const [rows] = await db.query(
    `SELECT ka.assignment_id, ka.ngayBatDau, ka.ngayKetThuc, ka.trangThai,
            k.kiosk_id, k.maKiosk, k.viTri, k.trangThai AS kioskTrangThai,
            z.zone_id, z.tenKhu, m.market_id, m.tenCho
     FROM kiosk_assignment ka
     JOIN kiosk k
       ON k.kiosk_id = ka.kiosk_id
       AND k.tenant_id = ka.tenant_id
     JOIN zone z
       ON z.zone_id = k.zone_id
       AND z.tenant_id = k.tenant_id
     JOIN market m
       ON m.market_id = z.market_id
       AND m.tenant_id = z.tenant_id
     WHERE ka.tenant_id = ?
       AND ka.merchant_id = ?
       AND ka.trangThai = 'active'
     ORDER BY ka.ngayBatDau DESC`,
    [tenant_id, merchant_id]
  );

  return rows;
};

exports.updatePassword = async (merchant_id, password_hash) => {
  const [result] = await db.execute(
    "UPDATE merchant SET password_hash = ? WHERE merchant_id = ?",
    [password_hash, merchant_id]
  );

  return result;
};