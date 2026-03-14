const db = require("../config/database");
const { isDuplicateKey } = require("./_dbErrors");

async function getCurrentPlan(tenant_id) {
  const [rows] = await db.query(
    `SELECT p.* FROM plan_subscription ps JOIN plan p ON ps.plan_id = p.plan_id WHERE ps.tenant_id = ? AND ps.trangThai = 'active' AND ps.ngayKetThuc > NOW() ORDER BY ps.subscription_id DESC LIMIT 1`,
    [tenant_id],
  );
  console.log("plan:", rows);
  return rows[0] || null;
}

async function countMarkets(tenant_id) {
  const [[row]] = await db.query(
    `SELECT COUNT(*) AS total FROM market WHERE tenant_id = ?`,
    [tenant_id],
  );
  return Number(row.total || 0);
}

const ALLOWED_SORT = new Set([
  "created_at",
  "updated_at",
  "market_id",
  "tenCho",
]);

function pickSort(sort) {
  return ALLOWED_SORT.has(sort) ? sort : "created_at";
}

async function existsName(tenant_id, tenCho, excludeId = null) {
  const params = [tenant_id, tenCho];
  let sql = `SELECT market_id FROM market WHERE tenant_id = ? AND tenCho = ?`;
  if (excludeId) {
    sql += ` AND market_id <> ?`;
    params.push(excludeId);
  }
  const [rows] = await db.query(sql + " LIMIT 1", params);
  return rows.length > 0;
}

exports.create = async (tenant_id, body) => {
  console.log("tenant_id:", tenant_id);
  const tenCho = (body.tenCho || "").trim();
  if (tenCho.length < 2)
    throw Object.assign(new Error("tenCho is required"), { statusCode: 400 });

  const plan = await getCurrentPlan(tenant_id);
  if (!plan) {
    throw Object.assign(
      new Error("Subscription không hợp lệ hoặc đã hết hạn"),
      { statusCode: 403 },
    );
  }
  const totalMarkets = await countMarkets(tenant_id);
  if (totalMarkets >= Number(plan.gioiHanSoCho || 0)) {
    throw Object.assign(
      new Error("Đã vượt quá số lượng chợ cho phép của gói"),
      { statusCode: 400 },
    );
  }

  if (await existsName(tenant_id, tenCho)) {
    throw Object.assign(new Error("tenCho already exists in this tenant"), {
      statusCode: 409,
    });
  }

  try {
    const [r] = await db.query(
      `INSERT INTO market (tenant_id, tenCho, diaChi, dienTich, trangThai)
       VALUES (?, ?, ?, ?, 'active')`,
      [tenant_id, tenCho, body.diaChi ?? null, body.dienTich ?? null],
    );
    return { market_id: r.insertId, tenant_id, tenCho };
  } catch (e) {
    if (isDuplicateKey(e))
      throw Object.assign(new Error("tenCho already exists in this tenant"), {
        statusCode: 409,
      });
    throw e;
  }
};

exports.update = async (tenant_id, market_id, body) => {
  const tenCho = body.tenCho != null ? String(body.tenCho).trim() : null;

  if (tenCho && (await existsName(tenant_id, tenCho, market_id))) {
    throw Object.assign(new Error("tenCho already exists in this tenant"), {
      statusCode: 409,
    });
  }

  try {
    const [r] = await db.query(
      `UPDATE market
       SET tenCho = COALESCE(?, tenCho),
           diaChi = COALESCE(?, diaChi),
           dienTich = COALESCE(?, dienTich)
       WHERE tenant_id = ? AND market_id = ?`,
      [
        tenCho,
        body.diaChi ?? null,
        body.dienTich ?? null,
        tenant_id,
        market_id,
      ],
    );
    if (!r.affectedRows)
      throw Object.assign(new Error("Market not found"), { statusCode: 404 });
    return { ok: true };
  } catch (e) {
    if (isDuplicateKey(e))
      throw Object.assign(new Error("tenCho already exists in this tenant"), {
        statusCode: 409,
      });
    throw e;
  }
};

exports.updateStatus = async (tenant_id, market_id, body) => {
  const trangThai = body.trangThai;
  if (!["active", "locked"].includes(trangThai))
    throw Object.assign(new Error("Invalid trangThai"), { statusCode: 400 });

  const [r] = await db.query(
    `UPDATE market SET trangThai = ? WHERE tenant_id = ? AND market_id = ?`,
    [trangThai, tenant_id, market_id],
  );
  if (r.affectedRows === 0)
    throw Object.assign(new Error("Market not found"), { statusCode: 404 });
  return { ok: true };
};

exports.list = async (tenant_id, filters, pg) => {
  const where = [`m.tenant_id = ?`];
  const params = [tenant_id];

  if (filters.trangThai) {
    where.push(`m.trangThai = ?`);
    params.push(filters.trangThai);
  }
  if (filters.q) {
    where.push(`(m.tenCho LIKE ? OR m.diaChi LIKE ?)`);
    params.push(`%${filters.q}%`, `%${filters.q}%`);
  }

  const sort = pickSort(pg.sort);
  const order = pg.order;

  const [[{ total }]] = await db.query(
    `SELECT COUNT(*) AS total FROM market m WHERE ${where.join(" AND ")}`,
    params,
  );

  const [rows] = await db.query(
    `SELECT m.*
     FROM market m
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