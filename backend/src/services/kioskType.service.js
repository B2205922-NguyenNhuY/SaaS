const db = require("../config/db");
const { isDuplicateKey } = require("./_dbErrors");

const ALLOWED_SORT = new Set([
  "created_at",
  "updated_at",
  "type_id",
  "tenLoai",
]);
const pickSort = (s) => (ALLOWED_SORT.has(s) ? s : "created_at");

async function existsTypeName(tenLoai, excludeId = null) {
  const params = [tenLoai];
  let sql = `SELECT type_id FROM kiosk_type WHERE tenLoai = ?`;
  if (excludeId) {
    sql += ` AND type_id <> ?`;
    params.push(excludeId);
  }
  const [rows] = await db.query(sql + " LIMIT 1", params);
  return rows.length > 0;
}

exports.create = async (body) => {
  const tenLoai = (body.tenLoai || "").trim();
  if (!tenLoai)
    throw Object.assign(new Error("tenLoai is required"), { statusCode: 400 });

  if (await existsTypeName(tenLoai)) {
    throw Object.assign(new Error("tenLoai already exists"), {
      statusCode: 409,
    });
  }

  try {
    const [r] = await db.query(
      `INSERT INTO kiosk_type (tenLoai, moTa) VALUES (?, ?)`,
      [tenLoai, body.moTa ?? null],
    );
    return { type_id: r.insertId, tenLoai };
  } catch (e) {
    if (isDuplicateKey(e))
      throw Object.assign(new Error("tenLoai already exists"), {
        statusCode: 409,
      });
    throw e;
  }
};

exports.update = async (type_id, body) => {
  const tenLoai = body.tenLoai != null ? String(body.tenLoai).trim() : null;
  if (tenLoai && (await existsTypeName(tenLoai, type_id))) {
    throw Object.assign(new Error("tenLoai already exists"), {
      statusCode: 409,
    });
  }

  try {
    const [r] = await db.query(
      `UPDATE kiosk_type SET tenLoai = COALESCE(?, tenLoai), moTa = COALESCE(?, moTa) WHERE type_id = ?`,
      [tenLoai, body.moTa ?? null, type_id],
    );
    if (!r.affectedRows)
      throw Object.assign(new Error("Kiosk type not found"), {
        statusCode: 404,
      });
    return { ok: true };
  } catch (e) {
    if (isDuplicateKey(e))
      throw Object.assign(new Error("tenLoai already exists"), {
        statusCode: 409,
      });
    throw e;
  }
};

exports.list = async (filters, pg) => {
  const where = ["1=1"];
  const params = [];
  if (filters.q) {
    where.push("(tenLoai LIKE ? OR moTa LIKE ?)");
    params.push(`%${filters.q}%`, `%${filters.q}%`);
  }

  const sort = pickSort(pg.sort);
  const order = pg.order;

  const [[{ total }]] = await db.query(
    `SELECT COUNT(*) total FROM kiosk_type WHERE ${where.join(" AND ")}`,
    params,
  );

  const [rows] = await db.query(
    `SELECT * FROM kiosk_type
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

exports.getById = async (type_id) => {
  const [rows] = await db.query(
    "SELECT * FROM kiosk_type WHERE type_id = ? LIMIT 1",
    [type_id],
  );
  if (!rows.length)
    throw Object.assign(new Error("Kiosk type not found"), { statusCode: 404 });
  return rows[0];
};
