const db = require("../config/database");
const { isDuplicateKey } = require("./_dbErrors");

const ALLOWED_SORT = new Set([
  "created_at",
  "updated_at",
  "assignment_id",
  "ngayBatDau",
  "ngayKetThuc",
  "trangThai",
]);
const pickSort = (s) => (ALLOWED_SORT.has(s) ? s : "created_at");

// helper yyyy-mm-dd "today" (theo local server time)
function todayYMD() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

// POST /kiosk_assignments
// - tạo record active, yêu cầu ngayBatDau
// - set kiosk occupied
exports.assign = async (tenant_id, body) => {
  const kiosk_id = Number(body.kiosk_id);
  const merchant_id = Number(body.merchant_id);
  const ngayBatDau = body.ngayBatDau;

  if (!kiosk_id || !merchant_id || !ngayBatDau) {
    throw Object.assign(
      new Error("kiosk_id, merchant_id, ngayBatDau are required"),
      { statusCode: 400 },
    );
  }

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    // lock kiosk row (tránh 2 request assign cùng lúc)
    const [[k]] = await conn.query(
      `SELECT kiosk_id, trangThai FROM kiosk WHERE tenant_id = ? AND kiosk_id = ? FOR UPDATE`,
      [tenant_id, kiosk_id],
    );
    if (k && ["locked", "maintenance"].includes(k.trangThai)) {
      throw Object.assign(new Error("Kiosk is not available for assignment"), {
        statusCode: 409,
      });
    }
    if (!k)
      throw Object.assign(new Error("Kiosk not found"), { statusCode: 404 });

    // tạo assignment active
    const [r] = await conn.query(
      `INSERT INTO kiosk_assignment (tenant_id, kiosk_id, merchant_id, ngayBatDau, trangThai)
       VALUES (?, ?, ?, ?, 'active')`,
      [tenant_id, kiosk_id, merchant_id, ngayBatDau],
    );

    // set kiosk occupied (nếu kiosk đang locked thì tùy bạn có chặn hay không)
    await conn.query(
      `UPDATE kiosk SET trangThai = 'occupied' WHERE tenant_id = ? AND kiosk_id = ?`,
      [tenant_id, kiosk_id],
    );

    await conn.commit();

    return {
      assignment_id: r.insertId,
      tenant_id,
      kiosk_id,
      merchant_id,
      ngayBatDau,
      trangThai: "active",
    };
  } catch (e) {
    await conn.rollback();

    // unique uq_ka_active_one => kiosk đang có active assignment
    if (
      isDuplicateKey(e) ||
      String(e.message || "").includes("uq_ka_active_one")
    ) {
      throw Object.assign(
        new Error(
          "Kiosk already assigned (active). End current assignment first.",
        ),
        { statusCode: 409 },
      );
    }
    throw e;
  } finally {
    conn.release();
  }
};

// GET /kiosk_assignments/:id/end
// - set ended
// - ngayKetThuc = today
// - set kiosk available
exports.end = async (tenant_id, assignment_id) => {
  const ngayKetThuc = todayYMD();

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const [[ka]] = await conn.query(
      `SELECT assignment_id, kiosk_id, trangThai
       FROM kiosk_assignment
       WHERE tenant_id = ? AND assignment_id = ?
       FOR UPDATE`,
      [tenant_id, assignment_id],
    );

    if (!ka) {
      throw Object.assign(new Error("Assignment not found"), {
        statusCode: 404,
      });
    }

    if (ka.trangThai !== "active") {
      throw Object.assign(new Error("Assignment already ended"), {
        statusCode: 409,
      });
    }

    await conn.query(
      `UPDATE kiosk_assignment
       SET ngayKetThuc = ?, trangThai = 'ended'
       WHERE tenant_id = ? AND assignment_id = ?`,
      [ngayKetThuc, tenant_id, assignment_id],
    );

    await conn.query(
      `UPDATE kiosk
       SET trangThai = 'available'
       WHERE tenant_id = ? AND kiosk_id = ? AND trangThai = 'occupied'`,
      [tenant_id, ka.kiosk_id],
    );

    await conn.commit();
    return { ok: true, ngayKetThuc, trangThai: "ended" };
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
};

// GET /kiosk_assignments (list + filter + paging)
exports.list = async (tenant_id, filters, pg) => {
  const where = ["ka.tenant_id = ?"];
  const params = [tenant_id];

  if (filters.kiosk_id) {
    where.push("ka.kiosk_id = ?");
    params.push(Number(filters.kiosk_id));
  }
  if (filters.merchant_id) {
    where.push("ka.merchant_id = ?");
    params.push(Number(filters.merchant_id));
  }
  if (filters.trangThai) {
    where.push("ka.trangThai = ?");
    params.push(filters.trangThai);
  }
  if (filters.q) {
    where.push("(m.hoTen LIKE ? OR k.maKiosk LIKE ?)");
    params.push(`%${filters.q}%`, `%${filters.q}%`);
  }

  const sort = pickSort(pg.sort);
  const order = pg.order;

  const [[{ total }]] = await db.query(
    `SELECT COUNT(*) total
     FROM kiosk_assignment ka
     JOIN merchant m ON m.merchant_id = ka.merchant_id AND m.tenant_id = ka.tenant_id
     JOIN kiosk k ON k.kiosk_id = ka.kiosk_id AND k.tenant_id = ka.tenant_id
     WHERE ${where.join(" AND ")}`,
    params,
  );

  const [rows] = await db.query(
    `SELECT ka.*,
            m.hoTen AS merchantName, m.soDienThoai, m.CCCD,
            k.maKiosk, k.viTri, k.trangThai AS kioskTrangThai,
            z.tenKhu, mk.tenCho
     FROM kiosk_assignment ka
     JOIN merchant m ON m.merchant_id = ka.merchant_id AND m.tenant_id = ka.tenant_id
     JOIN kiosk k ON k.kiosk_id = ka.kiosk_id AND k.tenant_id = ka.tenant_id
     JOIN zone z ON z.zone_id = k.zone_id AND z.tenant_id = k.tenant_id
     JOIN market mk ON mk.market_id = z.market_id AND mk.tenant_id = z.tenant_id
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