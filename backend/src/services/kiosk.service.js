const db = require("../config/db");
const { isDuplicateKey } = require("./_dbErrors");
const { assertKioskQuota } = require("../utils/quota");

const ALLOWED_SORT = new Set([
  "created_at",
  "updated_at",
  "kiosk_id",
  "maKiosk",
  "zone_id",
  "type_id",
  "trangThai",
]);
const pickSort = (s) => (ALLOWED_SORT.has(s) ? s : "created_at");

async function existsKioskCode(tenant_id, zone_id, maKiosk, excludeId = null) {
  const params = [tenant_id, zone_id, maKiosk];
  let sql = `SELECT kiosk_id FROM kiosk WHERE tenant_id = ? AND zone_id = ? AND maKiosk = ?`;
  if (excludeId) {
    sql += ` AND kiosk_id <> ?`;
    params.push(excludeId);
  }
  const [rows] = await db.query(sql + " LIMIT 1", params);
  return rows.length > 0;
}

exports.create = async (tenant_id, body) => {
  const zone_id = Number(body.zone_id);
  const type_id = Number(body.type_id);
  const maKiosk = (body.maKiosk || "").trim();
  await assertKioskQuota(tenant_id);

  if (!zone_id || !type_id || !maKiosk)
    throw Object.assign(new Error("zone_id, type_id, maKiosk are required"), {
      statusCode: 400,
    });

  if (await existsKioskCode(tenant_id, zone_id, maKiosk)) {
    throw Object.assign(new Error("maKiosk already exists in this zone"), {
      statusCode: 409,
    });
  }

  try {
    const [r] = await db.query(
      `INSERT INTO kiosk (tenant_id, zone_id, type_id, maKiosk, viTri, dienTich, trangThai)
       VALUES (?, ?, ?, ?, ?, ?, 'available')`,
      [
        tenant_id,
        zone_id,
        type_id,
        maKiosk,
        body.viTri ?? null,
        body.dienTich ?? null,
      ],
    );
    return { kiosk_id: r.insertId, tenant_id, zone_id, type_id, maKiosk };
  } catch (e) {
    if (isDuplicateKey(e))
      throw Object.assign(new Error("maKiosk already exists in this zone"), {
        statusCode: 409,
      });
    throw e;
  }
};

exports.update = async (tenant_id, kiosk_id, body) => {
  // 1) lấy current để check trùng nếu đổi zone/maKiosk
  const newZone = body.zone_id !== undefined ? Number(body.zone_id) : undefined;
  const newCode =
    body.maKiosk !== undefined ? String(body.maKiosk).trim() : undefined;

  if (newZone !== undefined || newCode !== undefined) {
    const [curRows] = await db.query(
      `SELECT zone_id, maKiosk FROM kiosk WHERE tenant_id = ? AND kiosk_id = ? LIMIT 1`,
      [tenant_id, kiosk_id],
    );
    if (!curRows.length)
      throw Object.assign(new Error("Kiosk not found"), { statusCode: 404 });

    const zone_id = newZone !== undefined ? newZone : curRows[0].zone_id;
    const maKiosk = newCode !== undefined ? newCode : curRows[0].maKiosk;

    if (!maKiosk)
      throw Object.assign(new Error("maKiosk cannot be empty"), {
        statusCode: 400,
      });

    if (await existsKioskCode(tenant_id, zone_id, maKiosk, kiosk_id)) {
      throw Object.assign(new Error("maKiosk already exists in this zone"), {
        statusCode: 409,
      });
    }
  }

  // 2) build SET động: field nào gửi lên mới update (kể cả null => set null)
  const sets = [];
  const params = [];

  if (body.zone_id !== undefined) {
    sets.push("zone_id = ?");
    params.push(Number(body.zone_id));
  }
  if (body.type_id !== undefined) {
    sets.push("type_id = ?");
    params.push(Number(body.type_id));
  }
  if (body.maKiosk !== undefined) {
    sets.push("maKiosk = ?");
    params.push(String(body.maKiosk).trim());
  }
  if (body.viTri !== undefined) {
    sets.push("viTri = ?");
    params.push(body.viTri);
  } // null allowed
  if (body.dienTich !== undefined) {
    sets.push("dienTich = ?");
    params.push(body.dienTich);
  } // null allowed

  if (sets.length === 0) {
    throw Object.assign(new Error("No fields to update"), { statusCode: 400 });
  }

  try {
    const [r] = await db.query(
      `UPDATE kiosk SET ${sets.join(", ")} WHERE tenant_id = ? AND kiosk_id = ?`,
      [...params, tenant_id, kiosk_id],
    );
    if (!r.affectedRows)
      throw Object.assign(new Error("Kiosk not found"), { statusCode: 404 });
    return { ok: true };
  } catch (e) {
    if (isDuplicateKey(e)) {
      throw Object.assign(new Error("maKiosk already exists in this zone"), {
        statusCode: 409,
      });
    }
    throw e;
  }
};

exports.updateStatus = async (tenant_id, kiosk_id, body) => {
  const trangThai = body.trangThai;
  const allowed = ["available", "occupied", "maintenance", "locked"];
  if (!allowed.includes(trangThai))
    throw Object.assign(new Error("Invalid trangThai"), { statusCode: 400 });

  const [r] = await db.query(
    `UPDATE kiosk SET trangThai = ? WHERE tenant_id = ? AND kiosk_id = ?`,
    [trangThai, tenant_id, kiosk_id],
  );
  if (!r.affectedRows)
    throw Object.assign(new Error("Kiosk not found"), { statusCode: 404 });
  return { ok: true };
};

exports.list = async (tenant_id, filters, pg) => {
  const where = ["k.tenant_id = ?"];
  const params = [tenant_id];

  if (filters.zone_id) {
    where.push("k.zone_id = ?");
    params.push(Number(filters.zone_id));
  }
  if (filters.type_id) {
    where.push("k.type_id = ?");
    params.push(Number(filters.type_id));
  }
  if (filters.trangThai) {
    where.push("k.trangThai = ?");
    params.push(filters.trangThai);
  }
  if (filters.q) {
    where.push("(k.maKiosk LIKE ? OR k.viTri LIKE ?)");
    params.push(`%${filters.q}%`, `%${filters.q}%`);
  }

  const sort = pickSort(pg.sort);
  const order = pg.order;

  const [[{ total }]] = await db.query(
    `SELECT COUNT(*) total FROM kiosk k WHERE ${where.join(" AND ")}`,
    params,
  );

  const [rows] = await db.query(
    `SELECT k.*, z.tenKhu, m.tenCho, kt.tenLoai
     FROM kiosk k
     JOIN zone z ON z.zone_id = k.zone_id AND z.tenant_id = k.tenant_id
     JOIN market m ON m.market_id = z.market_id AND m.tenant_id = z.tenant_id
     JOIN kiosk_type kt ON kt.type_id = k.type_id
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

exports.getById = async (tenant_id, kiosk_id) => {
  const [rows] = await db.query(
    `SELECT k.*, z.tenKhu, m.tenCho, kt.tenLoai
     FROM kiosk k
     JOIN zone z ON z.zone_id = k.zone_id AND z.tenant_id = k.tenant_id
     JOIN market m ON m.market_id = z.market_id AND m.tenant_id = z.tenant_id
     JOIN kiosk_type kt ON kt.type_id = k.type_id
     WHERE k.tenant_id = ? AND k.kiosk_id = ?
     LIMIT 1`,
    [tenant_id, kiosk_id],
  );

  if (!rows.length)
    throw Object.assign(new Error("Kiosk not found"), { statusCode: 404 });
  return rows[0];
};
