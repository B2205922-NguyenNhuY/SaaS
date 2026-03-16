const db = require("../config/db");
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

function todayYMD() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

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

    const [[kiosk]] = await conn.query(
      `SELECT kiosk_id, trangThai
       FROM kiosk
       WHERE tenant_id = ? AND kiosk_id = ?
       FOR UPDATE`,
      [tenant_id, kiosk_id],
    );

    if (!kiosk) {
      throw Object.assign(new Error("Kiosk not found"), { statusCode: 404 });
    }

    if (kiosk.trangThai !== "available") {
      throw Object.assign(
        new Error("Only kiosk with status 'available' can be assigned"),
        { statusCode: 409 },
      );
    }

    const [[merchant]] = await conn.query(
      `SELECT merchant_id, trangThai
       FROM merchant
       WHERE tenant_id = ? AND merchant_id = ?
       FOR UPDATE`,
      [tenant_id, merchant_id],
    );

    if (!merchant) {
      throw Object.assign(new Error("Merchant not found"), {
        statusCode: 404,
      });
    }

    if (merchant.trangThai !== "active") {
      throw Object.assign(new Error("Cannot assign inactive merchant"), {
        statusCode: 409,
      });
    }

    const [[active]] = await conn.query(
      `SELECT assignment_id
       FROM kiosk_assignment
       WHERE tenant_id = ? AND kiosk_id = ? AND trangThai = 'active'
       LIMIT 1
       FOR UPDATE`,
      [tenant_id, kiosk_id],
    );

    if (active) {
      throw Object.assign(
        new Error("Kiosk already assigned. End current assignment first."),
        { statusCode: 409 },
      );
    }

    const [r] = await conn.query(
      `INSERT INTO kiosk_assignment
        (tenant_id, kiosk_id, merchant_id, ngayBatDau, trangThai)
       VALUES (?, ?, ?, ?, 'active')`,
      [tenant_id, kiosk_id, merchant_id, ngayBatDau],
    );

    await conn.query(
      `UPDATE kiosk
       SET trangThai = 'occupied',
           updated_at = NOW()
       WHERE tenant_id = ? AND kiosk_id = ?`,
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

exports.endAssignment = async (tenant_id, assignment_id) => {
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
       SET ngayKetThuc = ?, trangThai = 'ended', updated_at = NOW()
       WHERE tenant_id = ? AND assignment_id = ?`,
      [ngayKetThuc, tenant_id, assignment_id],
    );

    await conn.query(
      `UPDATE kiosk
       SET trangThai = 'available', updated_at = NOW()
       WHERE tenant_id = ? AND kiosk_id = ?`,
      [tenant_id, ka.kiosk_id],
    );

    await conn.commit();

    return {
      ok: true,
      assignment_id,
      kiosk_id: ka.kiosk_id,
      ngayKetThuc,
      trangThai: "ended",
      kioskTrangThai: "available",
    };
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
};

exports.list = async (tenant_id, filters, pg) => {
  const where = ["ka.tenant_id = ?"];
  const params = [tenant_id];

  if (filters.market_id) {
    where.push("mk.market_id = ?");
    params.push(Number(filters.market_id));
  }

  if (filters.zone_id) {
    where.push("z.zone_id = ?");
    params.push(Number(filters.zone_id));
  }

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

  if (filters.ngayBatDau_from) {
    where.push("ka.ngayBatDau >= ?");
    params.push(filters.ngayBatDau_from);
  }

  if (filters.ngayBatDau_to) {
    where.push("ka.ngayBatDau <= ?");
    params.push(filters.ngayBatDau_to);
  }

  if (filters.ngayKetThuc_from) {
    where.push("ka.ngayKetThuc >= ?");
    params.push(filters.ngayKetThuc_from);
  }

  if (filters.ngayKetThuc_to) {
    where.push("ka.ngayKetThuc <= ?");
    params.push(filters.ngayKetThuc_to);
  }

  if (filters.q) {
    where.push(
      "(m.hoTen LIKE ? OR k.maKiosk LIKE ? OR z.tenKhu LIKE ? OR mk.tenCho LIKE ?)",
    );
    params.push(
      `%${filters.q}%`,
      `%${filters.q}%`,
      `%${filters.q}%`,
      `%${filters.q}%`,
    );
  }

  const sort = pickSort(pg.sort);
  const order =
    String(pg.order || "DESC").toUpperCase() === "ASC" ? "ASC" : "DESC";

  const fromJoin = `
    FROM kiosk_assignment ka
    JOIN merchant m
      ON m.merchant_id = ka.merchant_id
     AND m.tenant_id = ka.tenant_id
    JOIN kiosk k
      ON k.kiosk_id = ka.kiosk_id
     AND k.tenant_id = ka.tenant_id
    JOIN zone z
      ON z.zone_id = k.zone_id
     AND z.tenant_id = k.tenant_id
    JOIN market mk
      ON mk.market_id = z.market_id
     AND mk.tenant_id = z.tenant_id
  `;

  const [[{ total }]] = await db.query(
    `SELECT COUNT(*) AS total
     ${fromJoin}
     WHERE ${where.join(" AND ")}`,
    params,
  );

  const [rows] = await db.query(
    `SELECT ka.*, m.hoTen AS merchantName, m.soDienThoai, m.CCCD,
            k.maKiosk, k.viTri, k.trangThai AS kioskTrangThai,
            z.zone_id, z.tenKhu, mk.market_id, mk.tenCho
     ${fromJoin}
     WHERE ${where.join(" AND ")}
     ORDER BY ka.${sort} ${order}
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

exports.getById = async (tenant_id, assignment_id) => {
  const [rows] = await db.query(
    `SELECT ka.*, m.hoTen AS merchantName, m.soDienThoai, m.CCCD,
            k.maKiosk, k.viTri, k.trangThai AS kioskTrangThai,
            z.zone_id, z.tenKhu, mk.market_id, mk.tenCho
     FROM kiosk_assignment ka
     JOIN merchant m
       ON m.merchant_id = ka.merchant_id
      AND m.tenant_id = ka.tenant_id
     JOIN kiosk k
       ON k.kiosk_id = ka.kiosk_id
      AND k.tenant_id = ka.tenant_id
     JOIN zone z
       ON z.zone_id = k.zone_id
      AND z.tenant_id = k.tenant_id
     JOIN market mk
       ON mk.market_id = z.market_id
      AND mk.tenant_id = z.tenant_id
     WHERE ka.tenant_id = ? AND ka.assignment_id = ?
     LIMIT 1`,
    [tenant_id, assignment_id],
  );

  if (!rows.length) {
    throw Object.assign(new Error("Assignment not found"), {
      statusCode: 404,
    });
  }

  return rows[0];
};
