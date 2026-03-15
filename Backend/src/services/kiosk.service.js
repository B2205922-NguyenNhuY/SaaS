const kioskModel = require("../models/kiosk.model");
const zoneModel = require("../models/zone.model");
const marketModel = require("../models/market.model");

const ALLOWED_SORT = new Set([
  "created_at",
  "updated_at",
  "kiosk_id",
  "maKiosk",
  "zone_id",
  "type_id",
  "trangThai",
]);

const pickSort = (s) =>
  ALLOWED_SORT.has(s) ? s : "created_at";


exports.create = async (tenant_id, body) => {

  const zone_id = Number(body.zone_id);
  const type_id = Number(body.type_id);
  const maKiosk = (body.maKiosk || "").trim();

  const zone = await zoneModel.getById(tenant_id, zone_id);

  if (zone.trangThai !== "active") {
    throw new Error("Zone is  not active");
  }

  const market = await marketModel.getById(tenant_id, zone.market_id);

  if (market.trangThai !== "active") {
    throw new Error("Market is not active");
  }

  if (!zone_id || !type_id || !maKiosk) {
    throw Object.assign(
      new Error("zone_id, type_id, maKiosk are required"),
      { statusCode: 400 }
    );
  }

  const plan = await kioskModel.getCurrentPlan(tenant_id);

  if (!plan) {
    throw Object.assign(
      new Error("Subscription không hợp lệ hoặc đã hết hạn"),
      { statusCode: 403 }
    );
  }

  const total = await kioskModel.countKiosks(tenant_id);

  if (total >= Number(plan.gioiHanSoKiosk || 0)) {
    throw Object.assign(
      new Error("Đã vượt quá số lượng kiosk cho phép của gói"),
      { statusCode: 400 }
    );
  }

  const exists = await kioskModel.existsKioskCode(
    tenant_id,
    zone_id,
    maKiosk
  );

  if (exists) {
    throw Object.assign(
      new Error("maKiosk already exists in this zone"),
      { statusCode: 409 }
    );
  }

  const kiosk_id = await kioskModel.create(
    tenant_id,
    zone_id,
    type_id,
    maKiosk,
    body.viTri ?? null,
    body.dienTich ?? null
  );

  return { kiosk_id, tenant_id, zone_id, type_id, maKiosk };
};


exports.update = async (tenant_id, kiosk_id, body) => {
  // 1) lấy current để check trùng nếu đổi zone/maKiosk
  const newZone = body.zone_id !== undefined ? Number(body.zone_id) : undefined;
  const newCode =
    body.maKiosk !== undefined ? String(body.maKiosk).trim() : undefined;
  console.log("tenant_id:", tenant_id);
  console.log("kiosk_id:", kiosk_id);
  if (newZone !== undefined || newCode !== undefined) {
    const curRows = await kioskModel.getCurrent(tenant_id, kiosk_id);
    console.log("curRows:", curRows);
    if (!curRows)
      throw Object.assign(new Error("Kiosk not found"), { statusCode: 404 });

    const zone_id = newZone !== undefined ? newZone : curRows[0].zone_id;
    const maKiosk = newCode !== undefined ? newCode : curRows[0].maKiosk;

    if (!maKiosk)
      throw Object.assign(new Error("maKiosk cannot be empty"), {
        statusCode: 400,
      });

    if (await kioskModel.existsKioskCode(tenant_id, zone_id, maKiosk, kiosk_id)) {
      throw Object.assign(new Error("maKiosk already exists in this zone"), {
        statusCode: 409,
      });
    }
  }

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
  }

  if (body.dienTich !== undefined) {
    sets.push("dienTich = ?");
    params.push(body.dienTich);
  }

  if (sets.length === 0) {
    throw Object.assign(new Error("No fields to update"), { statusCode: 400 });
  }

  try {
    const r = await kioskModel.update(
      tenant_id,
      kiosk_id,
      sets,
      params
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

  const zone = await zoneModel.getById(tenant_id, body.zone_id);

  if (zone.trangThai !== "active") {
    throw new Error("Zone is  not active");
  }

  const market = await marketModel.getById(tenant_id, zone.market_id);

  if (market.trangThai !== "active") {
    throw new Error("Market is not active");
  }

  const allowed = [
    "available",
    "occupied",
    "maintenance",
    "locked",
  ];

  if (!allowed.includes(body.trangThai)) {
    throw Object.assign(
      new Error("Invalid trangThai"),
      { statusCode: 400 }
    );
  }

  const affected = await kioskModel.updateStatus(
    tenant_id,
    kiosk_id,
    body.trangThai
  );

  if (!affected) {
    throw Object.assign(
      new Error("Kiosk not found"),
      { statusCode: 404 }
    );
  }

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

  const whereSQL = where.join(" AND ");

  const sort = pickSort(pg.sort);
  const order = pg.order;

  const total = await kioskModel.count(whereSQL, params);

  const rows = await kioskModel.list(
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
      totalPages: Math.ceil(total / pg.limit),
    },
  };
};


exports.getById = async (tenant_id, kiosk_id) => {

  const kiosk = await kioskModel.getDetail(
    tenant_id,
    kiosk_id
  );

  if (!kiosk) {
    throw Object.assign(
      new Error("Kiosk not found"),
      { statusCode: 404 }
    );
  }

  return kiosk;
};