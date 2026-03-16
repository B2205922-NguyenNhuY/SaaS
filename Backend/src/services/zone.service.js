const db = require("../config/db");
const { isDuplicateKey } = require("./_dbErrors");

const ALLOWED_SORT = new Set([
  "created_at",
  "updated_at",
  "zone_id",
  "tenKhu",
  "market_id",
  "trangThai",
]);
const pickSort = (s) => (ALLOWED_SORT.has(s) ? s : "created_at");

async function getMarket(tenant_id, market_id) {
  const [rows] = await db.query(
    `SELECT * FROM market WHERE tenant_id = ? AND market_id = ? LIMIT 1`,
    [tenant_id, market_id],
  );
  return rows[0] || null;
}

async function getZoneRaw(tenant_id, zone_id) {
  const [rows] = await db.query(
    `SELECT * FROM zone WHERE tenant_id = ? AND zone_id = ? LIMIT 1`,
    [tenant_id, zone_id],
  );
  return rows[0] || null;
}

async function existsZoneName(tenant_id, market_id, tenKhu, excludeId = null) {
  const params = [tenant_id, market_id, tenKhu];
  let sql = `SELECT zone_id FROM zone WHERE tenant_id = ? AND market_id = ? AND tenKhu = ?`;
  if (excludeId) {
    sql += ` AND zone_id <> ?`;
    params.push(excludeId);
  }
  const [rows] = await db.query(sql + ` LIMIT 1`, params);
  return rows.length > 0;
}

exports.create = async (tenant_id, body) => {
  const market_id = Number(body.market_id);
  const tenKhu = String(body.tenKhu || "").trim();

  if (!market_id || !tenKhu) {
    throw Object.assign(new Error("market_id and tenKhu are required"), {
      statusCode: 400,
    });
  }

  const market = await getMarket(tenant_id, market_id);
  if (!market)
    throw Object.assign(new Error("Market not found"), { statusCode: 404 });
  if (market.trangThai !== "active") {
    throw Object.assign(new Error("Cannot create zone in locked market"), {
      statusCode: 409,
    });
  }

  if (await existsZoneName(tenant_id, market_id, tenKhu)) {
    throw Object.assign(new Error("tenKhu already exists in this market"), {
      statusCode: 409,
    });
  }

  try {
    const [r] = await db.query(
      `INSERT INTO zone (tenant_id, market_id, tenKhu, trangThai)
       VALUES (?, ?, ?, 'active')`,
      [tenant_id, market_id, tenKhu],
    );
    return { zone_id: r.insertId, tenant_id, market_id, tenKhu };
  } catch (e) {
    if (isDuplicateKey(e)) {
      throw Object.assign(new Error("tenKhu already exists in this market"), {
        statusCode: 409,
      });
    }
    throw e;
  }
};

exports.update = async (tenant_id, zone_id, body) => {
  const current = await getZoneRaw(tenant_id, zone_id);
  if (!current)
    throw Object.assign(new Error("Zone not found"), { statusCode: 404 });

  const market_id =
    body.market_id !== undefined ? Number(body.market_id) : current.market_id;
  const tenKhu =
    body.tenKhu !== undefined
      ? String(body.tenKhu || "").trim()
      : current.tenKhu;

  if (!market_id || !tenKhu) {
    throw Object.assign(new Error("market_id and tenKhu are required"), {
      statusCode: 400,
    });
  }

  const market = await getMarket(tenant_id, market_id);
  if (!market)
    throw Object.assign(new Error("Market not found"), { statusCode: 404 });
  if (market.trangThai !== "active") {
    throw Object.assign(
      new Error("Cannot move/update zone into locked market"),
      { statusCode: 409 },
    );
  }

  if (await existsZoneName(tenant_id, market_id, tenKhu, zone_id)) {
    throw Object.assign(new Error("tenKhu already exists in this market"), {
      statusCode: 409,
    });
  }

  try {
    await db.query(
      `UPDATE zone SET market_id = ?, tenKhu = ? WHERE tenant_id = ? AND zone_id = ?`,
      [market_id, tenKhu, tenant_id, zone_id],
    );
    return { ok: true };
  } catch (e) {
    if (isDuplicateKey(e)) {
      throw Object.assign(new Error("tenKhu already exists in this market"), {
        statusCode: 409,
      });
    }
    throw e;
  }
};

exports.updateStatus = async (tenant_id, zone_id, body) => {
  const trangThai = body.trangThai;
  if (!["active", "locked"].includes(trangThai)) {
    throw Object.assign(new Error("Invalid trangThai"), { statusCode: 400 });
  }

  const current = await getZoneRaw(tenant_id, zone_id);
  if (!current)
    throw Object.assign(new Error("Zone not found"), { statusCode: 404 });

  if (trangThai === "locked") {
    const [[child]] = await db.query(
      `SELECT COUNT(*) AS activeKiosks
         FROM kiosk
        WHERE tenant_id = ? AND zone_id = ? AND trangThai IN ('available','occupied','maintenance')`,
      [tenant_id, zone_id],
    );
    if (Number(child.activeKiosks || 0) > 0) {
      throw Object.assign(
        new Error("Cannot lock zone while it still has active kiosks"),
        { statusCode: 409 },
      );
    }
  }

  await db.query(
    `UPDATE zone SET trangThai = ? WHERE tenant_id = ? AND zone_id = ?`,
    [trangThai, tenant_id, zone_id],
  );
  return { ok: true };
};

exports.list = async (tenant_id, filters, pg) => {
  const where = ["z.tenant_id = ?"];
  const params = [tenant_id];

  if (filters.market_id) {
    where.push("z.market_id = ?");
    params.push(Number(filters.market_id));
  }
  if (filters.trangThai) {
    where.push("z.trangThai = ?");
    params.push(filters.trangThai);
  }
  if (filters.tenCho) {
    where.push("m.tenCho LIKE ?");
    params.push(`%${filters.tenCho}%`);
  }
  if (filters.market_trangThai) {
    where.push("m.trangThai = ?");
    params.push(filters.market_trangThai);
  }
  if (filters.q) {
    where.push("(z.tenKhu LIKE ? OR m.tenCho LIKE ?)");
    params.push(`%${filters.q}%`, `%${filters.q}%`);
  }

  const sort = pickSort(pg.sort);
  const order = pg.order;

  const [[{ total }]] = await db.query(
    `SELECT COUNT(*) AS total
       FROM zone z
       JOIN market m ON m.market_id = z.market_id AND m.tenant_id = z.tenant_id
      WHERE ${where.join(" AND ")}`,
    params,
  );

  const [rows] = await db.query(
    `SELECT z.*, m.tenCho, m.trangThai AS market_trangThai
       FROM zone z
       JOIN market m ON m.market_id = z.market_id AND m.tenant_id = z.tenant_id
      WHERE ${where.join(" AND ")}
      ORDER BY z.${sort} ${order}
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

exports.getById = async (tenant_id, zone_id) => {
  const [rows] = await db.query(
    `SELECT z.*, m.tenCho, m.trangThai AS market_trangThai
       FROM zone z
       JOIN market m ON m.market_id = z.market_id AND m.tenant_id = z.tenant_id
      WHERE z.tenant_id = ? AND z.zone_id = ? LIMIT 1`,
    [tenant_id, zone_id],
  );
  if (!rows.length)
    throw Object.assign(new Error("Zone not found"), { statusCode: 404 });
  return rows[0];
};
