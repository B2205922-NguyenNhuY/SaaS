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

exports.updateStatus = async (tenant_id, merchant_id, trangThai) => {
  // Lấy connection từ Pool để thực hiện Transaction
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    if (trangThai === "inactive") {
      // 1. Kiểm tra nợ phí
      // Sử dụng connection.query thay vì db.query để ở trong Transaction
      const [unpaid] = await connection.query(
        `SELECT COUNT(*) as count 
         FROM charge 
         WHERE tenant_id = ? AND merchant_id = ? 
         AND trangThai IN ('chua_thu', 'no')`,
        [tenant_id, merchant_id],
      );

      if (unpaid[0].count > 0) {
        throw Object.assign(
          new Error(
            "Không thể ngừng hoạt động: Tiểu thương còn khoản nợ chưa thanh toán",
          ),
          { statusCode: 400 },
        );
      }

      // 2. Tự động giải phóng các Kiosk đang thuê
      const [activeAssignments] = await connection.query(
        `SELECT kiosk_id FROM kiosk_assignment 
         WHERE tenant_id = ? AND merchant_id = ? AND trangThai = 'active'`,
        [tenant_id, merchant_id],
      );

      if (activeAssignments.length > 0) {
        const kioskIds = activeAssignments.map((a) => a.kiosk_id);

        // A. Kết thúc các hợp đồng gán
        await connection.query(
          `UPDATE kiosk_assignment 
           SET trangThai = 'ended', ngayKetThuc = CURDATE() 
           WHERE tenant_id = ? AND merchant_id = ? AND trangThai = 'active'`,
          [tenant_id, merchant_id],
        );

        // B. Cập nhật trạng thái Kiosk về 'available'
        await connection.query(
          `UPDATE kiosk 
           SET trangThai = 'available' 
           WHERE tenant_id = ? AND kiosk_id IN (?)`,
          [tenant_id, kioskIds],
        );
      }
    }

    // 3. Cập nhật trạng thái Merchant
    const [result] = await connection.query(
      `UPDATE merchant 
       SET trangThai = ?, 
           inactive_at = CASE WHEN ? = 'inactive' THEN CURRENT_TIMESTAMP ELSE NULL END, 
           updated_at = CURRENT_TIMESTAMP 
       WHERE tenant_id = ? AND merchant_id = ?`,
      [trangThai, trangThai, tenant_id, merchant_id],
    );

    if (!result.affectedRows) {
      throw Object.assign(new Error("Không tìm thấy tiểu thương"), {
        statusCode: 404,
      });
    }

    // Xác nhận mọi thay đổi thành công
    await connection.commit();

    return {
      ok: true,
      message: `Trạng thái tiểu thương đã chuyển sang ${trangThai}`,
    };
  } catch (error) {
    // Nếu có bất kỳ lỗi nào, hoàn tác toàn bộ các bước trên
    await connection.rollback();
    throw error;
  } finally {
    // Quan trọng: Trả lại connection vào Pool
    connection.release();
  }
};
