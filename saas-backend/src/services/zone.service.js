const db = require("../config/db");
const { isDuplicateKey } = require("./_dbErrors");

const ALLOWED_SORT = new Set([
  "created_at",
  "updated_at",
  "zone_id",
  "tenKhu",
  "market_id",
]);
const pickSort = (s) => (ALLOWED_SORT.has(s) ? s : "created_at");

async function existsZoneName(tenant_id, market_id, tenKhu, excludeId = null) {
  const params = [tenant_id, market_id, tenKhu];
  let sql = `SELECT zone_id FROM zone WHERE tenant_id = ? AND market_id = ? AND tenKhu = ?`;
  if (excludeId) {
    sql += ` AND zone_id <> ?`;
    params.push(excludeId);
  }
  const [rows] = await db.query(sql + " LIMIT 1", params);
  return rows.length > 0;
}

exports.create = async (tenant_id, body) => {
  const market_id = Number(body.market_id);
  const tenKhu = (body.tenKhu || "").trim();
  if (!market_id || tenKhu.length < 1)
    throw Object.assign(new Error("market_id & tenKhu are required"), {
      statusCode: 400,
    });

  if (await existsZoneName(tenant_id, market_id, tenKhu)) {
    throw Object.assign(new Error("tenKhu already exists in this market"), {
      statusCode: 409,
    });
  }

  try {
    const [r] = await db.query(
      `INSERT INTO zone (tenant_id, market_id, tenKhu, trangThai) VALUES (?, ?, ?, 'active')`,
      [tenant_id, market_id, tenKhu],
    );
    return { zone_id: r.insertId, tenant_id, market_id, tenKhu };
  } catch (e) {
    if (isDuplicateKey(e))
      throw Object.assign(new Error("tenKhu already exists in this market"), {
        statusCode: 409,
      });
    throw e;
  }
};

exports.update = async (tenant_id, zone_id, body) => {
  // nếu đổi market_id hoặc tenKhu => check trùng theo cặp mới
  const newMarket = body.market_id != null ? Number(body.market_id) : null;
  const newName = body.tenKhu != null ? String(body.tenKhu).trim() : null;

  if (newMarket || newName) {
    // lấy giá trị hiện tại để check đúng cặp
    const [curRows] = await db.query(
      `SELECT market_id, tenKhu FROM zone WHERE tenant_id = ? AND zone_id = ? LIMIT 1`,
      [tenant_id, zone_id],
    );
    if (!curRows.length)
      throw Object.assign(new Error("Zone not found"), { statusCode: 404 });

    const market_id = newMarket ?? curRows[0].market_id;
    const tenKhu = newName ?? curRows[0].tenKhu;

    if (await existsZoneName(tenant_id, market_id, tenKhu, zone_id)) {
      throw Object.assign(new Error("tenKhu already exists in this market"), {
        statusCode: 409,
      });
    }
  }

  try {
    const [r] = await db.query(
      `UPDATE zone
       SET tenKhu = COALESCE(?, tenKhu),
           market_id = COALESCE(?, market_id)
       WHERE tenant_id = ? AND zone_id = ?`,
      [newName, newMarket, tenant_id, zone_id],
    );
    if (!r.affectedRows)
      throw Object.assign(new Error("Zone not found"), { statusCode: 404 });
    return { ok: true };
  } catch (e) {
    if (isDuplicateKey(e))
      throw Object.assign(new Error("tenKhu already exists in this market"), {
        statusCode: 409,
      });
    throw e;
  }
};

exports.updateStatus = async (tenant_id, zone_id, body) => {
  const trangThai = body.trangThai;
  if (!["active", "locked"].includes(trangThai))
    throw Object.assign(new Error("Invalid trangThai"), { statusCode: 400 });

  const [r] = await db.query(
    `UPDATE zone SET trangThai = ? WHERE tenant_id = ? AND zone_id = ?`,
    [trangThai, tenant_id, zone_id],
  );
  if (!r.affectedRows)
    throw Object.assign(new Error("Zone not found"), { statusCode: 404 });
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
  if (filters.q) {
    where.push("(z.tenKhu LIKE ?)");
    params.push(`%${filters.q}%`);
  }

  const sort = pickSort(pg.sort);
  const order = pg.order;

  const [[{ total }]] = await db.query(
    `SELECT COUNT(*) total FROM zone z WHERE ${where.join(" AND ")}`,
    params,
  );

  const [rows] = await db.query(
    `SELECT z.*, m.tenCho
     FROM zone z
     JOIN market m ON m.market_id = z.market_id AND m.tenant_id = z.tenant_id
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
