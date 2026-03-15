const zoneModel = require("../models/zone.model");
const marketModel = require("../models/market.model");

const ALLOWED_SORT = new Set([
  "created_at",
  "updated_at",
  "zone_id",
  "tenKhu",
  "market_id"
]);

const pickSort = (s) => ALLOWED_SORT.has(s) ? s : "created_at";

exports.create = async (tenant_id, body) => {

  const market_id = Number(body.market_id);
  const tenKhu = (body.tenKhu || "").trim();

  if (!market_id || tenKhu.length < 1) {
    throw Object.assign(
      new Error("market_id & tenKhu are required"),
      { statusCode: 400 }
    );
  }

  const market = await marketModel.getById(market_id, tenant_id);

  if (market.trangThai !== "active") {
    throw new Error("Market is inactive");
  }

  const exists = await zoneModel.existsZoneName(
    tenant_id,
    market_id,
    tenKhu
  );

  if (exists) {
    throw Object.assign(
      new Error("tenKhu already exists in this market"),
      { statusCode: 409 }
    );
  }

  const zone_id = await zoneModel.create(
    tenant_id,
    market_id,
    tenKhu
  );

  return { zone_id, tenant_id, market_id, tenKhu };
};


exports.update = async (tenant_id, zone_id, body) => {

  const market = await marketModel.getById(tenant_id, body.market_id);

  if (market.trangThai !== "active") {
    throw new Error("Market is inactive");
  }

  const newMarket =
    body.market_id != null ? Number(body.market_id) : null;

  const newName =
    body.tenKhu != null ? String(body.tenKhu).trim() : null;

  if (newMarket || newName) {

    const current = await zoneModel.getById(
      tenant_id,
      zone_id
    );

    if (!current) {
      throw Object.assign(
        new Error("Zone not found"),
        { statusCode: 404 }
      );
    }

    const market_id = newMarket ?? current.market_id;
    const tenKhu = newName ?? current.tenKhu;

    const exists = await zoneModel.existsZoneName(
      tenant_id,
      market_id,
      tenKhu,
      zone_id
    );

    if (exists) {
      throw Object.assign(
        new Error("tenKhu already exists in this market"),
        { statusCode: 409 }
      );
    }
  }

  const affected = await zoneModel.update(
    tenant_id,
    zone_id,
    newName,
    newMarket
  );

  if (!affected) {
    throw Object.assign(
      new Error("Zone not found"),
      { statusCode: 404 }
    );
  }

  return { ok: true };
};


exports.updateStatus = async (tenant_id, zone_id, body) => {

  const { trangThai } = body;

  if (!["active", "locked"].includes(trangThai)) {
    throw Object.assign(
      new Error("Invalid trangThai"),
      { statusCode: 400 }
    );
  }

  const market = await marketModel.getById(tenant_id, body.market_id);

  if (market.trangThai !== "active") {
    throw new Error("Market is inactive");
  }

  const affected = await zoneModel.updateStatus(
    tenant_id,
    zone_id,
    trangThai
  );

  if (!affected) {
    throw Object.assign(
      new Error("Zone not found"),
      { statusCode: 404 }
    );
  }

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
    where.push("z.tenKhu LIKE ?");
    params.push(`%${filters.q}%`);
  }

  const whereSQL = where.join(" AND ");

  const sort = pickSort(pg.sort);
  const order = pg.order;

  const total = await zoneModel.count(whereSQL, params);

  const rows = await zoneModel.list(
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

exports.getById = async (tenant_id, zone_id) => {
  const zone = await zoneModel.getById(tenant_id, zone_id);

  if (!zone) {
    throw Object.assign(
      new Error("Zone not found"),
      { statusCode: 404 }
    );
  }

  return zone;
};