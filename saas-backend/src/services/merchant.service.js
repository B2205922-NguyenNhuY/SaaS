const db = require("../config/db");
const ALLOWED_SORT = new Set([
  "created_at",
  "updated_at",
  "merchant_id",
  "hoTen",
  "soDienThoai",
  "trangThai",
]);
const pickSort = (s) => (ALLOWED_SORT.has(s) ? s : "created_at");

exports.create = async (tenant_id, body) => {
  const hoTen = (body.hoTen || "").trim();
  const CCCD = (body.CCCD || "").trim();
  if (hoTen.length < 1 || CCCD.length !== 12)
    throw Object.assign(new Error("hoTen and CCCD(12) are required"), {
      statusCode: 400,
    });

  const soDienThoai = body.soDienThoai ?? null;
  const maSoThue = body.maSoThue ?? null;
  const diaChiThuongTru = body.diaChiThuongTru ?? null;
  const ngayThamGiaKinhDoanh = body.ngayThamGiaKinhDoanh ?? null;

  const [r] = await db.query(
    `INSERT INTO merchant (tenant_id, hoTen, soDienThoai, CCCD, maSoThue, diaChiThuongTru, ngayThamGiaKinhDoanh, trangThai)
     VALUES (?, ?, ?, ?, ?, ?, ?, 'active')`,
    [
      tenant_id,
      hoTen,
      soDienThoai,
      CCCD,
      maSoThue,
      diaChiThuongTru,
      ngayThamGiaKinhDoanh,
    ],
  );

  return { merchant_id: r.insertId, tenant_id, hoTen, CCCD };
};

exports.update = async (tenant_id, merchant_id, body) => {
  const hoTen = body.hoTen != null ? String(body.hoTen).trim() : null;
  const soDienThoai = body.soDienThoai ?? null;
  const maSoThue = body.maSoThue ?? null;
  const diaChiThuongTru = body.diaChiThuongTru ?? null;
  const ngayThamGiaKinhDoanh = body.ngayThamGiaKinhDoanh ?? null;
  const trangThai = body.trangThai ?? null;

  if (trangThai && !["active", "inactive"].includes(trangThai))
    throw Object.assign(new Error("Invalid trangThai"), { statusCode: 400 });

  const [r] = await db.query(
    `UPDATE merchant
     SET hoTen = COALESCE(?, hoTen),
         soDienThoai = COALESCE(?, soDienThoai),
         maSoThue = COALESCE(?, maSoThue),
         diaChiThuongTru = COALESCE(?, diaChiThuongTru),
         ngayThamGiaKinhDoanh = COALESCE(?, ngayThamGiaKinhDoanh),
         trangThai = COALESCE(?, trangThai),
         inactive_at = CASE WHEN ? = 'inactive' THEN NOW() ELSE inactive_at END
     WHERE tenant_id = ? AND merchant_id = ?`,
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
    ],
  );
  if (!r.affectedRows)
    throw Object.assign(new Error("Merchant not found"), { statusCode: 404 });
  return { ok: true };
};

exports.list = async (tenant_id, filters, pg) => {
  const where = ["m.tenant_id = ?"];
  const params = [tenant_id];

  if (filters.trangThai) {
    where.push("m.trangThai = ?");
    params.push(filters.trangThai);
  }
  if (filters.soDienThoai) {
    where.push("m.soDienThoai = ?");
    params.push(filters.soDienThoai);
  }
  if (filters.q) {
    where.push("(m.hoTen LIKE ? OR m.CCCD LIKE ? OR m.maSoThue LIKE ?)");
    params.push(`%${filters.q}%`, `%${filters.q}%`, `%${filters.q}%`);
  }

  const sort = pickSort(pg.sort);
  const order = pg.order;

  const [[{ total }]] = await db.query(
    `SELECT COUNT(*) total FROM merchant m WHERE ${where.join(" AND ")}`,
    params,
  );

  const [rows] = await db.query(
    `SELECT m.*
     FROM merchant m
     WHERE ${where.join(" AND ")}
     ORDER BY ${sort} ${order}
     LIMIT ? OFFSET ?`,
    [...params, pg.limit, pg.offset],
  );

  return {
    data: rows,
    meta: {
      page: pg.page,
      limit: pg.limit,
      total,
      totalPages: Math.ceil(total / pg.limit),
    },
  };
};

exports.detail = async (tenant_id, merchant_id) => {
  const [rows] = await db.query(
    `SELECT * FROM merchant WHERE tenant_id = ? AND merchant_id = ? LIMIT 1`,
    [tenant_id, merchant_id],
  );
  if (!rows.length)
    throw Object.assign(new Error("Merchant not found"), { statusCode: 404 });

  // kèm danh sách kiosk đang gán (active)
  const [assign] = await db.query(
    `SELECT ka.assignment_id, ka.ngayBatDau, ka.ngayKetThuc, ka.trangThai,
            k.kiosk_id, k.maKiosk, k.viTri, k.trangThai AS kioskTrangThai,
            z.zone_id, z.tenKhu, m.market_id, m.tenCho
     FROM kiosk_assignment ka
     JOIN kiosk k ON k.kiosk_id = ka.kiosk_id AND k.tenant_id = ka.tenant_id
     JOIN zone z ON z.zone_id = k.zone_id AND z.tenant_id = k.tenant_id
     JOIN market m ON m.market_id = z.market_id AND m.tenant_id = z.tenant_id
     WHERE ka.tenant_id = ? AND ka.merchant_id = ? AND ka.trangThai = 'active'
     ORDER BY ka.ngayBatDau DESC`,
    [tenant_id, merchant_id],
  );

  return { ...rows[0], active_assignments: assign };
};
