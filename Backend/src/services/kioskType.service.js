const kioskTypeModel = require("../models/kioskType.model");

const ALLOWED_SORT = new Set([
  "created_at",
  "updated_at",
  "type_id",
  "tenLoai"
]);

const pickSort = (s) =>
  ALLOWED_SORT.has(s) ? s : "created_at";

exports.create = async (body) => {

  const tenLoai = (body.tenLoai || "").trim();

  if (!tenLoai) {
    throw Object.assign(
      new Error("tenLoai is required"),
      { statusCode: 400 }
    );
  }

  const exists = await kioskTypeModel.existsTypeName(tenLoai);

  if (exists) {
    throw Object.assign(
      new Error("tenLoai already exists"),
      { statusCode: 409 }
    );
  }

  const type_id = await kioskTypeModel.create(
    tenLoai,
    body.moTa ?? null
  );

  return { type_id, tenLoai };
};


exports.update = async (type_id, body) => {

  const tenLoai =
    body.tenLoai != null
      ? String(body.tenLoai).trim()
      : null;

  if (tenLoai) {

    const exists =
      await kioskTypeModel.existsTypeName(
        tenLoai,
        type_id
      );

    if (exists) {
      throw Object.assign(
        new Error("tenLoai already exists"),
        { statusCode: 409 }
      );
    }
  }

  const affected = await kioskTypeModel.update(
    type_id,
    tenLoai,
    body.moTa ?? null
  );

  if (!affected) {
    throw Object.assign(
      new Error("Kiosk type not found"),
      { statusCode: 404 }
    );
  }

  return { ok: true };
};


exports.list = async (filters, pg) => {

  const where = ["1=1"];
  const params = [];

  if (filters.q) {
    where.push("(tenLoai LIKE ? OR moTa LIKE ?)");
    params.push(`%${filters.q}%`, `%${filters.q}%`);
  }

  const whereSQL = where.join(" AND ");

  const sort = pickSort(pg.sort);
  const order = pg.order;

  const total = await kioskTypeModel.count(
    whereSQL,
    params
  );

  const rows = await kioskTypeModel.list(
    whereSQL,
    params,
    sort,
    order,
    pg.limit,
    pg.offset
  );

  return {
    data: rows,
    meta: {
      page: pg.page,
      limit: pg.limit,
      total,
      totalPages: Math.ceil(total / pg.limit)
    }
  };
};

exports.getById = async (type_id) => {
  const type = await kioskTypeModel.getById(type_id);

  if (!type) {
    throw Object.assign(
      new Error("Kiosk type not found"),
      { statusCode: 404 }
    );
  }

  return type;
};