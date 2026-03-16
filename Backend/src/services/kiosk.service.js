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
  "dienTich",
]);
const pickSort = (s) => (ALLOWED_SORT.has(s) ? s : "created_at");

async function existsKioskCode(tenant_id, zone_id, maKiosk, excludeId = null) {
  const params = [tenant_id, zone_id, maKiosk];
  let sql = `SELECT kiosk_id FROM kiosk WHERE tenant_id = ? AND zone_id = ? AND maKiosk = ?`;
  if (excludeId) {
    sql += ` AND kiosk_id <> ?`;
    params.push(excludeId);
  }
  const [rows] = await db.query(sql + ` LIMIT 1`, params);
  return rows.length > 0;
}

async function getZoneWithMarket(tenant_id, zone_id) {
  const [rows] = await db.query(
    `SELECT z.zone_id, z.market_id, z.trangThai AS zone_trangThai,
            m.trangThai AS market_trangThai
       FROM zone z
       JOIN market m ON m.market_id = z.market_id AND m.tenant_id = z.tenant_id
      WHERE z.tenant_id = ? AND z.zone_id = ? LIMIT 1`,
    [tenant_id, zone_id],
  );
  return rows[0] || null;
}

async function getType(type_id) {
  const [rows] = await db.query(
    `SELECT * FROM kiosk_type WHERE type_id = ? LIMIT 1`,
    [type_id],
  );
  return rows[0] || null;
}

async function getKioskRaw(tenant_id, kiosk_id) {
  const [rows] = await db.query(
    `SELECT * FROM kiosk WHERE tenant_id = ? AND kiosk_id = ? LIMIT 1`,
    [tenant_id, kiosk_id],
  );
  return rows[0] || null;
}

async function hasActiveAssignment(tenant_id, kiosk_id) {
  const [[row]] = await db.query(
    `SELECT COUNT(*) AS total FROM kiosk_assignment WHERE tenant_id = ? AND kiosk_id = ? AND trangThai = 'active'`,
    [tenant_id, kiosk_id],
  );
  return Number(row.total || 0) > 0;
}

exports.create = async (tenant_id, body) => {
  const zone_id = Number(body.zone_id);
  const type_id = Number(body.type_id);
  const maKiosk = String(body.maKiosk || "").trim();
  const dienTich = body.dienTich ?? null;

  if (!zone_id || !type_id || !maKiosk) {
    throw Object.assign(new Error("zone_id, type_id, maKiosk are required"), {
      statusCode: 400,
    });
  }
  if (dienTich != null && Number(dienTich) <= 0) {
    throw Object.assign(new Error("dienTich must be greater than 0"), {
      statusCode: 400,
    });
  }

  await assertKioskQuota(tenant_id);

  const zone = await getZoneWithMarket(tenant_id, zone_id);
  if (!zone)
    throw Object.assign(new Error("Zone not found"), { statusCode: 404 });
  if (zone.zone_trangThai !== "active" || zone.market_trangThai !== "active") {
    throw Object.assign(
      new Error("Cannot create kiosk in locked zone or market"),
      { statusCode: 409 },
    );
  }

  const type = await getType(type_id);
  if (!type)
    throw Object.assign(new Error("Kiosk type not found"), { statusCode: 404 });

  if (await existsKioskCode(tenant_id, zone_id, maKiosk)) {
    throw Object.assign(new Error("maKiosk already exists in this zone"), {
      statusCode: 409,
    });
  }

  try {
    const [r] = await db.query(
      `INSERT INTO kiosk (tenant_id, zone_id, type_id, maKiosk, viTri, dienTich, trangThai)
       VALUES (?, ?, ?, ?, ?, ?, 'available')`,
      [tenant_id, zone_id, type_id, maKiosk, body.viTri ?? null, dienTich],
    );
    return { kiosk_id: r.insertId, tenant_id, zone_id, type_id, maKiosk };
  } catch (e) {
    if (isDuplicateKey(e)) {
      throw Object.assign(new Error("maKiosk already exists in this zone"), {
        statusCode: 409,
      });
    }
    throw e;
  }
};

exports.update = async (tenant_id, kiosk_id, body) => {
  const current = await getKioskRaw(tenant_id, kiosk_id);
  if (!current)
    throw Object.assign(new Error("Kiosk not found"), { statusCode: 404 });

  const zone_id =
    body.zone_id !== undefined ? Number(body.zone_id) : current.zone_id;
  const type_id =
    body.type_id !== undefined ? Number(body.type_id) : current.type_id;
  const maKiosk =
    body.maKiosk !== undefined
      ? String(body.maKiosk || "").trim()
      : current.maKiosk;
  const viTri = body.viTri !== undefined ? body.viTri : current.viTri;
  const dienTich =
    body.dienTich !== undefined ? body.dienTich : current.dienTich;

  if (!zone_id || !type_id || !maKiosk) {
    throw Object.assign(new Error("zone_id, type_id, maKiosk are required"), {
      statusCode: 400,
    });
  }
  if (dienTich != null && Number(dienTich) <= 0) {
    throw Object.assign(new Error("dienTich must be greater than 0"), {
      statusCode: 400,
    });
  }

  const zone = await getZoneWithMarket(tenant_id, zone_id);
  if (!zone)
    throw Object.assign(new Error("Zone not found"), { statusCode: 404 });
  if (zone.zone_trangThai !== "active" || zone.market_trangThai !== "active") {
    throw Object.assign(
      new Error("Cannot move/update kiosk into locked zone or market"),
      { statusCode: 409 },
    );
  }

  const type = await getType(type_id);
  if (!type)
    throw Object.assign(new Error("Kiosk type not found"), { statusCode: 404 });

  if (await existsKioskCode(tenant_id, zone_id, maKiosk, kiosk_id)) {
    throw Object.assign(new Error("maKiosk already exists in this zone"), {
      statusCode: 409,
    });
  }

  try {
    await db.query(
      `UPDATE kiosk
          SET zone_id = ?, type_id = ?, maKiosk = ?, viTri = ?, dienTich = ?
        WHERE tenant_id = ? AND kiosk_id = ?`,
      [zone_id, type_id, maKiosk, viTri, dienTich, tenant_id, kiosk_id],
    );
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
  if (!allowed.includes(trangThai)) {
    throw Object.assign(new Error("Invalid trangThai"), { statusCode: 400 });
  }

  const current = await getKioskRaw(tenant_id, kiosk_id);
  if (!current)
    throw Object.assign(new Error("Kiosk not found"), { statusCode: 404 });

  if (
    trangThai === "available" &&
    (await hasActiveAssignment(tenant_id, kiosk_id))
  ) {
    throw Object.assign(
      new Error(
        "Cannot set kiosk to available while it still has an active assignment",
      ),
      { statusCode: 409 },
    );
  }

  await db.query(
    `UPDATE kiosk SET trangThai = ? WHERE tenant_id = ? AND kiosk_id = ?`,
    [trangThai, tenant_id, kiosk_id],
  );
  return { ok: true };
};

exports.list = async (tenant_id, filters, pg) => {
  const where = ["k.tenant_id = ?"];
  const params = [tenant_id];

  if (filters.market_id) {
    where.push("m.market_id = ?");
    params.push(Number(filters.market_id));
  }
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
  if (filters.maKiosk) {
    where.push("k.maKiosk LIKE ?");
    params.push(`%${filters.maKiosk}%`);
  }
  if (filters.viTri) {
    where.push("k.viTri LIKE ?");
    params.push(`%${filters.viTri}%`);
  }
  if (filters.dienTich_min != null && filters.dienTich_min !== "") {
    where.push("k.dienTich >= ?");
    params.push(Number(filters.dienTich_min));
  }
  if (filters.dienTich_max != null && filters.dienTich_max !== "") {
    where.push("k.dienTich <= ?");
    params.push(Number(filters.dienTich_max));
  }
  if (filters.q) {
    where.push(
      "(k.maKiosk LIKE ? OR k.viTri LIKE ? OR z.tenKhu LIKE ? OR m.tenCho LIKE ?)",
    );
    params.push(
      `%${filters.q}%`,
      `%${filters.q}%`,
      `%${filters.q}%`,
      `%${filters.q}%`,
    );
  }

  const sort = pickSort(pg.sort);
  const order = pg.order;

  const baseJoin = `
    FROM kiosk k
    JOIN zone z ON z.zone_id = k.zone_id AND z.tenant_id = k.tenant_id
    JOIN market m ON m.market_id = z.market_id AND m.tenant_id = z.tenant_id
    JOIN kiosk_type kt ON kt.type_id = k.type_id
  `;

  const [[{ total }]] = await db.query(
    `SELECT COUNT(*) AS total ${baseJoin} WHERE ${where.join(" AND ")}`,
    params,
  );

  const [rows] = await db.query(
    `SELECT k.*, z.tenKhu, z.market_id, m.tenCho, m.trangThai AS market_trangThai, kt.tenLoai
       ${baseJoin}
      WHERE ${where.join(" AND ")}
      ORDER BY k.${sort} ${order}
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
    `SELECT k.*, z.tenKhu, z.market_id, m.tenCho, m.trangThai AS market_trangThai, kt.tenLoai
       FROM kiosk k
       JOIN zone z ON z.zone_id = k.zone_id AND z.tenant_id = k.tenant_id
       JOIN market m ON m.market_id = z.market_id AND m.tenant_id = z.tenant_id
       JOIN kiosk_type kt ON kt.type_id = k.type_id
      WHERE k.tenant_id = ? AND k.kiosk_id = ? LIMIT 1`,
    [tenant_id, kiosk_id],
  );
  if (!rows.length)
    throw Object.assign(new Error("Kiosk not found"), { statusCode: 404 });
  return rows[0];
};
