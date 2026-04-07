const db = require("../config/db");

exports.insert = async (conn, { tenant_id, password_hash, hoTen, soDienThoai, CCCD, maSoThue, diaChiThuongTru, ngayThamGiaKinhDoanh }) => {
  const [r] = await conn.execute(
    `INSERT INTO merchant
       (tenant_id, password_hash, hoTen, soDienThoai, CCCD, maSoThue, diaChiThuongTru, ngayThamGiaKinhDoanh, trangThai)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active')`,
    [tenant_id, password_hash, hoTen, soDienThoai, CCCD, maSoThue, diaChiThuongTru, ngayThamGiaKinhDoanh]
  );
  return r.insertId;
};

exports.updateInfo = async (conn, tenant_id, merchant_id, { hoTen, soDienThoai, CCCD, maSoThue, diaChiThuongTru, ngayThamGiaKinhDoanh, trangThai }) => {
  const [r] = await conn.execute(
    `UPDATE merchant
        SET hoTen = ?, soDienThoai = ?, CCCD = ?, maSoThue = ?,
            diaChiThuongTru = ?, ngayThamGiaKinhDoanh = ?, trangThai = ?,
            inactive_at = CASE
              WHEN ? = 'inactive' THEN NOW()
              WHEN ? = 'active'   THEN NULL
              ELSE inactive_at
            END,
            updated_at = NOW()
      WHERE tenant_id = ? AND merchant_id = ?`,
    [hoTen, soDienThoai, CCCD, maSoThue, diaChiThuongTru, ngayThamGiaKinhDoanh,
     trangThai, trangThai, trangThai, tenant_id, merchant_id]
  );
  return r.affectedRows;
};

exports.updateStatus = async (conn, tenant_id, merchant_id, trangThai) => {
  const [r] = await conn.execute(
    `UPDATE merchant
        SET trangThai   = ?,
            inactive_at = CASE WHEN ? = 'inactive' THEN NOW() ELSE NULL END,
            updated_at  = NOW()
      WHERE tenant_id = ? AND merchant_id = ?`,
    [trangThai, trangThai, tenant_id, merchant_id]
  );
  return r.affectedRows;
};

exports.updatePassword = async (tenant_id, merchant_id, password_hash) => {
  const [r] = await db.execute(
    `UPDATE merchant SET password_hash = ?, updated_at = NOW()
      WHERE tenant_id = ? AND merchant_id = ?`,
    [password_hash, tenant_id, merchant_id]
  );
  return r.affectedRows;
};

exports.getById = async (tenant_id, merchant_id) => {
  const [rows] = await db.query(
    `SELECT * FROM merchant WHERE tenant_id = ? AND merchant_id = ? LIMIT 1`,
    [tenant_id, merchant_id]
  );
  return rows[0] || null;
};

exports.getByIdWithConn = async (conn, tenant_id, merchant_id) => {
  const [rows] = await conn.execute(
    `SELECT * FROM merchant WHERE tenant_id = ? AND merchant_id = ? LIMIT 1`,
    [tenant_id, merchant_id]
  );
  return rows[0] || null;
};

exports.getBySoDienThoai = async (tenant_id, soDienThoai) => {
  const [rows] = await db.query(
    `SELECT * FROM merchant WHERE tenant_id = ? AND soDienThoai = ? LIMIT 1`,
    [tenant_id, soDienThoai]
  );
  return rows[0] || null;
};

exports.list = async (tenant_id, filters, pg) => {
  const where  = ["m.tenant_id = ?"];
  const params = [tenant_id];

  if (filters.trangThai) {
    where.push("m.trangThai = ?");
    params.push(filters.trangThai);
  }

  if (filters.soDienThoai) {
    where.push("m.soDienThoai = ?");
    params.push(filters.soDienThoai);
  }

  if (filters.CCCD) {
    where.push("m.CCCD = ?");
    params.push(filters.CCCD);
  }

  if (filters.maSoThue) {
    where.push("m.maSoThue = ?");
    params.push(filters.maSoThue);
  }

  if (filters.has_active_assignment === "true") {
    where.push(`EXISTS (
      SELECT 1 FROM kiosk_assignment ka
      WHERE ka.tenant_id = m.tenant_id AND ka.merchant_id = m.merchant_id AND ka.trangThai = 'active'
    )`);
  }

  if (filters.has_active_assignment === "false") {
    where.push(`NOT EXISTS (
      SELECT 1 FROM kiosk_assignment ka
      WHERE ka.tenant_id = m.tenant_id AND ka.merchant_id = m.merchant_id AND ka.trangThai = 'active'
    )`);
  }

  if (filters.q) {
    where.push("(m.hoTen LIKE ? OR m.CCCD LIKE ? OR m.maSoThue LIKE ? OR m.soDienThoai LIKE ?)");
    const like = `%${filters.q}%`;
    params.push(like, like, like, like);
  }

  const ALLOWED_SORT = new Set(["created_at", "updated_at", "merchant_id", "hoTen", "soDienThoai", "trangThai"]);
  const sort  = ALLOWED_SORT.has(pg.sort) ? pg.sort : "created_at";
  const order = String(pg.order || "DESC").toUpperCase() === "ASC" ? "ASC" : "DESC";
  const sql   = where.join(" AND ");

  const [[{ total }]] = await db.query(
    `SELECT COUNT(*) AS total FROM merchant m WHERE ${sql}`,
    params
  );

  const [rows] = await db.query(
    `SELECT m.*,
      EXISTS (
        SELECT 1 FROM kiosk_assignment ka
        WHERE ka.tenant_id = m.tenant_id
          AND ka.merchant_id = m.merchant_id
          AND ka.trangThai = 'active'
      ) AS has_active_assignment
    FROM merchant m
    WHERE ${sql}
    ORDER BY m.${sort} ${order}
    LIMIT ? OFFSET ?`,
    [...params, pg.limit, pg.offset]
  );

  return {
    data: rows,
    meta: { page: pg.page, limit: pg.limit, total, totalPages: Math.ceil(total / pg.limit) },
  };
};

exports.getActiveAssignments = async (tenant_id, merchant_id) => {
  const [rows] = await db.query(
    `SELECT ka.assignment_id, ka.ngayBatDau, ka.ngayKetThuc, ka.trangThai,
            k.kiosk_id, k.maKiosk, k.viTri, k.trangThai AS kioskTrangThai,
            z.zone_id, z.tenKhu,
            mkt.market_id, mkt.tenCho
       FROM kiosk_assignment ka
       JOIN kiosk   k   ON k.kiosk_id    = ka.kiosk_id   AND k.tenant_id   = ka.tenant_id
       JOIN zone    z   ON z.zone_id     = k.zone_id     AND z.tenant_id   = k.tenant_id
       JOIN market  mkt ON mkt.market_id = z.market_id   AND mkt.tenant_id = z.tenant_id
      WHERE ka.tenant_id = ? AND ka.merchant_id = ? AND ka.trangThai = 'active'
      ORDER BY ka.ngayBatDau DESC`,
    [tenant_id, merchant_id]
  );
  return rows;
};

exports.countActive = async (tenant_id) => {
  const [[{ total }]] = await db.query(
    `SELECT COUNT(*) AS total FROM merchant WHERE tenant_id = ? AND trangThai = 'active'`,
    [tenant_id]
  );
  return total;
};

exports.hasAnyCharge = async (conn, tenant_id, merchant_id) => {
  const [rows] = await conn.execute(
    `SELECT 1 FROM charge WHERE tenant_id = ? AND merchant_id = ? LIMIT 1`,
    [tenant_id, merchant_id]
  );
  return rows.length > 0;
};

exports.hasOutstandingDebt = async (conn, tenant_id, merchant_id) => {
  const [rows] = await conn.execute(
    `SELECT 1 FROM charge
      WHERE tenant_id = ? AND merchant_id = ? AND trangThai IN ('chua_thu', 'no')
      LIMIT 1`,
    [tenant_id, merchant_id]
  );
  return rows.length > 0;
};

exports.hasActiveAssignment = async (conn, tenant_id, merchant_id) => {
  const [rows] = await conn.execute(
    `SELECT 1 FROM kiosk_assignment
      WHERE tenant_id = ? AND merchant_id = ? AND trangThai = 'active'
      LIMIT 1`,
    [tenant_id, merchant_id]
  );
  return rows.length > 0;
};

// ✅ export function
exports.checkDuplicatePhone = async function ({
  soDienThoai,
  tenant_id,
  excludeId = null
}) {
  const query = `
    SELECT merchant_id 
    FROM merchant 
    WHERE soDienThoai = ? 
      AND tenant_id = ?
      ${excludeId ? 'AND merchant_id != ?' : ''}
    LIMIT 1
  `;

  const params = excludeId
    ? [soDienThoai, tenant_id, excludeId]
    : [soDienThoai, tenant_id];

  const [rows] = await db.execute(query, params);

  return rows.length > 0;
};