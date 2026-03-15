const marketModel = require("../models/market.model");

const ALLOWED_SORT = new Set([
  "created_at",
  "updated_at",
  "market_id",
  "tenCho"
]);

function pickSort(sort) {
  return ALLOWED_SORT.has(sort) ? sort : "created_at";
}

exports.create = async (tenant_id, body) => {

  const tenCho = (body.tenCho || "").trim();

  if (tenCho.length < 2) {
    throw Object.assign(
      new Error("tenCho is required"),
      { statusCode: 400 }
    );
  }

  const plan = await marketModel.getCurrentPlan(tenant_id);

  if (!plan) {
    throw Object.assign(
      new Error("Subscription không hợp lệ hoặc đã hết hạn"),
      { statusCode: 403 }
    );
  }

  const totalMarkets = await marketModel.countMarkets(tenant_id);

  if (totalMarkets >= Number(plan.gioiHanSoCho || 0)) {
    throw Object.assign(
      new Error("Đã vượt quá số lượng chợ cho phép của gói"),
      { statusCode: 400 }
    );
  }

  const exists = await marketModel.existsName(tenant_id, tenCho);

  if (exists) {
    throw Object.assign(
      new Error("tenCho already exists in this tenant"),
      { statusCode: 409 }
    );
  }

  const market_id = await marketModel.create(tenant_id, {
    tenCho,
    diaChi: body.diaChi ?? null,
    dienTich: body.dienTich ?? null
  });

  return { market_id, tenant_id, tenCho };
};

exports.update = async (tenant_id, market_id, body) => {

  const tenCho =
    body.tenCho != null ? String(body.tenCho).trim() : null;

  if (tenCho) {
    const exists = await marketModel.existsName(
      tenant_id,
      tenCho,
      market_id
    );

    if (exists) {
      throw Object.assign(
        new Error("tenCho already exists in this tenant"),
        { statusCode: 409 }
      );
    }
  }

  const affected = await marketModel.update(
    tenant_id,
    market_id,
    {
      tenCho,
      diaChi: body.diaChi ?? null,
      dienTich: body.dienTich ?? null
    }
  );

  if (!affected) {
    throw Object.assign(
      new Error("Market not found"),
      { statusCode: 404 }
    );
  }

  return { ok: true };
};

exports.updateStatus = async (tenant_id, market_id, body) => {

  const { trangThai } = body;

  if (!["active", "locked"].includes(trangThai)) {
    throw Object.assign(
      new Error("Invalid trangThai"),
      { statusCode: 400 }
    );
  }

  const affected = await marketModel.updateStatus(
    tenant_id,
    market_id,
    trangThai
  );

  if (!affected) {
    throw Object.assign(
      new Error("Market not found"),
      { statusCode: 404 }
    );
  }

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

  const whereSQL = where.join(" AND ");

  const sort = pickSort(pg.sort);
  const order = pg.order;

  const total = await marketModel.count(whereSQL, params);

  const rows = await marketModel.list(
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

exports.getById = async (tenant_id, market_id) => {

  const market = await marketModel.getById(tenant_id, market_id);

  if (!market) {
    throw Object.assign(
      new Error("Market not found"),
      { statusCode: 404 }
    );
  }

  return market;

};