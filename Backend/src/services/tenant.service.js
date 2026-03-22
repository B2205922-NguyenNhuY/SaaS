const tenantModel = require("../models/tenant.model");
const userModel = require("../models/users.model");
const roleModel = require("../models/role.model");
const db = require("../config/db");
const bcrypt = require("bcrypt");

const SALT_ROUNDS = 10;

exports.createTenant = async (body) => {
  const { tenBanQuanLy, diachi, soDienThoai, email, admin, firstMarket } = body;

  if (!email || !diachi || !tenBanQuanLy || !soDienThoai) {
    throw Object.assign(new Error("Missing tenant fields"), { statusCode: 400 });
  }

  if (!admin || !admin.email || !admin.password || !admin.hoTen || !admin.soDienThoai) {
    throw Object.assign(new Error("Missing admin fields"), { statusCode: 400 });
  }

  const duplicateTenant = await tenantModel.checkDuplicate(email, soDienThoai);
  if (duplicateTenant.length > 0) {
    throw Object.assign(new Error("Email hoặc SĐT tenant đã tồn tại"), { statusCode: 400 });
  }

  const password_hash = await bcrypt.hash(admin.password, SALT_ROUNDS);
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const role = await roleModel.getRoleByName(connection, "tenant_admin");
    if (!role) {
      throw Object.assign(new Error("Role tenant_admin không tồn tại"), { statusCode: 400 });
    }

    const tenantResult = await tenantModel.createTenant(connection, {
      tenBanQuanLy,
      diaChi: diachi,
      soDienThoai,
      email,
      trangThai: "active",
    });
    const tenantId = tenantResult.insertId;

    const duplicateUser = await userModel.checkDuplicate(connection, admin.email, admin.soDienThoai, tenantId);
    if (duplicateUser.length > 0) {
      throw Object.assign(new Error("Email hoặc SĐT admin đã tồn tại"), { statusCode: 400 });
    }

    const userResult = await userModel.createUser(connection, {
      email: admin.email,
      password_hash,
      hoTen: admin.hoTen,
      soDienThoai: admin.soDienThoai,
      tenant_id: tenantId,
      role_id: role.role_id,
      trangThai: "active",
    });

    // Tạo chợ đầu tiên (bắt buộc)
    if (!firstMarket || !firstMarket.tenCho) {
      throw Object.assign(new Error("Phải có ít nhất 1 chợ khi tạo tenant"), { statusCode: 400 });
    }

    const [marketResult] = await connection.execute(
      `INSERT INTO market (tenant_id, tenCho, diaChi, dienTich, trangThai) VALUES (?, ?, ?, ?, 'active')`,
      [tenantId, firstMarket.tenCho, firstMarket.diaChi || null, firstMarket.dienTich || null]
    );
    const marketId = marketResult.insertId;

    await connection.commit();

    return {
      tenant_id: tenantId,
      admin_user_id: userResult.insertId,
      market_id: marketId,
    };
  } catch (error) {
    try { await connection.rollback(); } catch (_) {}

    if (error.code === "ER_DUP_ENTRY") {
      throw Object.assign(new Error("Email hoặc SĐT đã tồn tại"), { statusCode: 400 });
    }
    throw error;
  } finally {
    connection.release();
  }
};

exports.getAllTenants = async () => {
  return await tenantModel.getAllTenants();
};

exports.getTenantById = async (id) => {
  const tenant = await tenantModel.getTenantById(id);
  if (!tenant) {
    throw Object.assign(new Error("Tenant not found"), { statusCode: 404 });
  }
  return tenant;
};

exports.listTenants = async (filters) => {
  const page = Number(filters.page) || 1;
  const limit = Number(filters.limit) || 10;
  const offset = (page - 1) * limit;

  const rows = await tenantModel.listTenants(filters, offset, limit);
  const total = await tenantModel.countTenants(filters);

  return {
    data: rows,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
};

exports.updateTenantStatus = async (id, trangThai) => {
  if (!["active", "suspended"].includes(trangThai)) {
    throw Object.assign(new Error("Invalid status"), { statusCode: 400 });
  }
  const existing = await tenantModel.getTenantById(id);
  if (!existing) {
    throw Object.assign(new Error("Tenant not found"), { statusCode: 404 });
  }
  await tenantModel.updateTenantStatus(id, trangThai);
};

exports.updateTenantInfo = async (id, body) => {
  const { tenBanQuanLy, diachi, soDienThoai, email } = body;

  if (!email || !diachi || !tenBanQuanLy || !soDienThoai) {
    throw Object.assign(new Error("Missing required fields"), { statusCode: 400 });
  }

  const existing = await tenantModel.getTenantById(id);
  if (!existing) {
    throw Object.assign(new Error("Tenant not found"), { statusCode: 404 });
  }

  const duplicate = await tenantModel.checkDuplicateForUpdate(id, email, soDienThoai);
  if (duplicate.length > 0) {
    throw Object.assign(new Error("Email hoặc Số điện thoại đã tồn tại"), { statusCode: 400 });
  }

  await tenantModel.updateTenantInfo(id, body);
};