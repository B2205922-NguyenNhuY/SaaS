const db = require("../config/db");
const { isDuplicateKey } = require("./_dbErrors");
const { assertMarketQuota } = require("../utils/quota");

const ALLOWED_SORT = new Set([
  "created_at",
  "updated_at",
  "market_id",
  "tenCho",
  "diaChi",
  "dienTich",
  "trangThai",
]);

const pickSort = (s) => (ALLOWED_SORT.has(s) ? s : "created_at");

async function existsName(tenant_id, tenCho, excludeId = null) {
  const params = [tenant_id, tenCho];
  let sql = `SELECT market_id FROM market WHERE tenant_id = ? AND tenCho = ?`;

  if (excludeId) {
    sql += ` AND market_id <> ?`;
    params.push(excludeId);
  }

  const [rows] = await db.query(sql + ` LIMIT 1`, params);
  return rows.length > 0;
}

async function getMarketRaw(tenant_id, market_id) {
  const [rows] = await db.query(
    `SELECT * FROM market WHERE tenant_id = ? AND market_id = ? LIMIT 1`,
    [tenant_id, market_id],
  );
  return rows[0] || null;
}

exports.create = async (tenant_id, body) => {
  const tenCho = String(body.tenCho || "").trim();
  const diaChi = body.diaChi ?? null;
  const dienTich = body.dienTich ?? null;

  if (tenCho.length < 2) {
    throw Object.assign(new Error("tenCho is required"), { statusCode: 400 });
  }

  if (dienTich != null && Number(dienTich) <= 0) {
    throw Object.assign(new Error("dienTich must be greater than 0"), {
      statusCode: 400,
    });
  }

  await assertMarketQuota(tenant_id);

  if (await existsName(tenant_id, tenCho)) {
    throw Object.assign(new Error("tenCho already exists in this tenant"), {
      statusCode: 409,
    });
  }

  try {
    const [r] = await db.query(
      `INSERT INTO market (tenant_id, tenCho, diaChi, dienTich, trangThai)
       VALUES (?, ?, ?, ?, 'active')`,
      [tenant_id, tenCho, diaChi, dienTich],
    );

    return { market_id: r.insertId, tenant_id, tenCho };
  } catch (e) {
    if (isDuplicateKey(e)) {
      throw Object.assign(new Error("tenCho already exists in this tenant"), {
        statusCode: 409,
      });
    }
    throw e;
  }
};

exports.update = async (tenant_id, market_id, body) => {
  const current = await getMarketRaw(tenant_id, market_id);

  if (!current) {
    throw Object.assign(new Error("Market not found"), { statusCode: 404 });
  }

  const tenCho =
    body.tenCho !== undefined
      ? String(body.tenCho || "").trim()
      : current.tenCho;

  const diaChi = body.diaChi !== undefined ? body.diaChi : current.diaChi;
  const dienTich =
    body.dienTich !== undefined ? body.dienTich : current.dienTich;

  if (tenCho.length < 2) {
    throw Object.assign(new Error("tenCho is required"), { statusCode: 400 });
  }

  if (dienTich != null && Number(dienTich) <= 0) {
    throw Object.assign(new Error("dienTich must be greater than 0"), {
      statusCode: 400,
    });
  }

  if (await existsName(tenant_id, tenCho, market_id)) {
    throw Object.assign(new Error("tenCho already exists in this tenant"), {
      statusCode: 409,
    });
  }

  try {
    await db.query(
      `UPDATE market
       SET tenCho = ?, diaChi = ?, dienTich = ?
       WHERE tenant_id = ? AND market_id = ?`,
      [tenCho, diaChi, dienTich, tenant_id, market_id],
    );

    return { ok: true };
  } catch (e) {
    if (isDuplicateKey(e)) {
      throw Object.assign(new Error("tenCho already exists in this tenant"), {
        statusCode: 409,
      });
    }
    throw e;
  }
};

exports.updateStatus = async (tenant_id, market_id, body) => {
  const trangThai = body.trangThai;

  if (!["active", "locked"].includes(trangThai)) {
    throw Object.assign(new Error("Invalid trangThai"), { statusCode: 400 });
  }

  const current = await getMarketRaw(tenant_id, market_id);

  if (!current) {
    throw Object.assign(new Error("Market not found"), { statusCode: 404 });
  }

  if (trangThai === "locked") {
    const [[child]] = await db.query(
      `SELECT
         (SELECT COUNT(*) FROM zone
           WHERE tenant_id = ? AND market_id = ? AND trangThai = 'active') AS activeZones,
         (SELECT COUNT(*)
            FROM kiosk k
            JOIN zone z ON z.zone_id = k.zone_id AND z.tenant_id = k.tenant_id
           WHERE k.tenant_id = ? AND z.market_id = ?
             AND k.trangThai IN ('available','occupied','maintenance')) AS activeKiosks`,
      [tenant_id, market_id, tenant_id, market_id],
    );

    if (
      Number(child.activeZones || 0) > 0 ||
      Number(child.activeKiosks || 0) > 0
    ) {
      throw Object.assign(
        new Error(
          "Cannot lock market while it still has active zones or kiosks",
        ),
        { statusCode: 409 },
      );
    }
  }

  await db.query(
    `UPDATE market SET trangThai = ? WHERE tenant_id = ? AND market_id = ?`,
    [trangThai, tenant_id, market_id],
  );

  return { ok: true };
};

exports.list = async (tenant_id, filters, pg) => {
  const where = [`m.tenant_id = ?`];
  const params = [tenant_id];

  if (filters.trangThai) {
    where.push(`m.trangThai = ?`);
    params.push(filters.trangThai);
  }

  if (filters.diaChi) {
    where.push(`m.diaChi LIKE ?`);
    params.push(`%${filters.diaChi}%`);
  }

  if (filters.min_dienTich != null && filters.min_dienTich !== "") {
    where.push(`m.dienTich >= ?`);
    params.push(Number(filters.min_dienTich));
  }

  if (filters.max_dienTich != null && filters.max_dienTich !== "") {
    where.push(`m.dienTich <= ?`);
    params.push(Number(filters.max_dienTich));
  }

  if (filters.q) {
    where.push(`(m.tenCho LIKE ? OR m.diaChi LIKE ?)`);
    params.push(`%${filters.q}%`, `%${filters.q}%`);
  }

  const sort = pickSort(pg.sort);
  const order =
    String(pg.order || "DESC").toUpperCase() === "ASC" ? "ASC" : "DESC";

  const [[{ total }]] = await db.query(
    `SELECT COUNT(*) AS total
     FROM market m
     WHERE ${where.join(" AND ")}`,
    params,
  );

  const [rows] = await db.query(
    `SELECT m.*
     FROM market m
     WHERE ${where.join(" AND ")}
     ORDER BY m.${sort} ${order}
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

exports.getById = async (tenant_id, market_id) => {
  const market = await getMarketRaw(tenant_id, market_id);

  if (!market) {
    throw Object.assign(new Error("Market not found"), { statusCode: 404 });
  }

  return market;
};
