const merchantModel = require("../models/merchant.model");
const userModel = require("../models/users.model");
const planSubscriptionModel = require("../models/plan_subscription.model");

const bcrypt = require("bcrypt");

const SALT_ROUNDS = 10;

const ALLOWED_SORT = new Set([
  "created_at",
  "updated_at",
  "merchant_id",
  "hoTen",
  "soDienThoai",
  "trangThai",
]);

const pickSort = (s) =>
  ALLOWED_SORT.has(s) ? s : "created_at";

exports.create = async (tenant_id, body) => {
    const totalAccounts = await userModel.countAccountsByTenant(tenant_id);
    
    const plan = await planSubscriptionModel.getPlanByTenantSubscribed(tenant_id);
    
    if (!plan) {
    throw Object.assign(
        new Error("Subscription không hợp lệ hoặc hết hạn"),
        { statusCode: 403 }
    );
    }

    if (totalAccounts >= plan[0].gioiHanUser) {
    throw Object.assign(
        new Error("Đã vượt quá số lượng user cho phép của gói"),
        { statusCode: 400 }
    );
    }

  const hoTen = (body.hoTen || "").trim();
  const CCCD = (body.CCCD || "").trim();
  const password = body.password;

  
  if (hoTen.length < 1 || CCCD.length !== 12) {
    throw Object.assign(
      new Error("hoTen and CCCD(12) are required"),
      { statusCode: 400 }
    );
  }
  if (!password) {
      throw Object.assign(
        new Error("Password is required"),
        { statusCode: 400 }
      );
    }

    const password_hash = await bcrypt.hash(password, SALT_ROUNDS);

  const merchant_id = await merchantModel.create(
    tenant_id,
    password_hash,
    hoTen,
    body.soDienThoai ?? null,
    CCCD,
    body.maSoThue ?? null,
    body.diaChiThuongTru ?? null,
    body.ngayThamGiaKinhDoanh ?? null
  );

  return { merchant_id, tenant_id, hoTen, CCCD };
};

exports.update = async (tenant_id, merchant_id, body) => {

  const trangThai = body.trangThai ?? null;

  if (trangThai && !["active", "inactive"].includes(trangThai)) {
    throw Object.assign(
      new Error("Invalid trangThai"),
      { statusCode: 400 }
    );
  }

  const affected = await merchantModel.update(
    tenant_id,
    merchant_id,
    body.hoTen != null ? String(body.hoTen).trim() : null,
    body.soDienThoai ?? null,
    body.maSoThue ?? null,
    body.diaChiThuongTru ?? null,
    body.ngayThamGiaKinhDoanh ?? null,
    trangThai
  );

  if (!affected) {
    throw Object.assign(
      new Error("Merchant not found"),
      { statusCode: 404 }
    );
  }

  return { ok: true };
};

exports.list = async (tenant_id, filters, pg) => {

  const where = ["m.tenant_id = ?"];
  const params = [tenant_id];

  if (filters.trangThai) {
    where.push("m.trangThai = ?");
    params.push(filters.trangThai);
  }

  if (filters.soDienThoai) {
    where.push("m.soDienThoai = ?");
    params.push(filters.soDienThoai);
  }

  if (filters.q) {
    where.push(
      "(m.hoTen LIKE ? OR m.CCCD LIKE ? OR m.maSoThue LIKE ?)"
    );
    params.push(
      `%${filters.q}%`,
      `%${filters.q}%`,
      `%${filters.q}%`
    );
  }

  const whereSQL = where.join(" AND ");

  const sort = pickSort(pg.sort);
  const order = pg.order;

  const total = await merchantModel.count(
    whereSQL,
    params
  );

  const rows = await merchantModel.list(
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

exports.detail = async (tenant_id, merchant_id) => {

  const merchant = await merchantModel.getById(
    tenant_id,
    merchant_id
  );

  if (!merchant) {
    throw Object.assign(
      new Error("Merchant not found"),
      { statusCode: 404 }
    );
  }

  const assignments =
    await merchantModel.getActiveAssignments(
      tenant_id,
      merchant_id
    );

  return {
    ...merchant,
    active_assignments: assignments,
  };
};