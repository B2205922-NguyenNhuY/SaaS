const tenantModel = require("../models/tenant.model");
const userModel = require("../models/users.model");
const roleModel = require("../models/role.model");
const db = require("../config/db");
const bcrypt = require("bcrypt");
const MarketService = require("./market.service");

const SALT_ROUNDS = 10;

const { ROLE_CREATE_PERMISSION, ROLES } = require("../constants/role");

exports.createTenant = async (body) => {
  const {
    tenBanQuanLy,
    email,
    soDienThoai,
    diachi,
    maSoThue,
    tenCongTy,
    nguoiDaiDien,
    chucVu,
    giayPhepKinhDoanh,
    ngayCapPhep,
    noiCapPhep,
    admin,
    markets = [],
  } = body;

  if (!tenBanQuanLy || !email || !soDienThoai || !diachi || !maSoThue) {
    throw Object.assign(new Error("Missing required fields"), { statusCode: 400 });
  }

  if (!admin?.hoTen || !admin?.email || !admin?.soDienThoai || !admin?.password) {
    throw Object.assign(new Error("Admin info is required"), { statusCode: 400 });
  }

  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();

    const [existingTenant] = await connection.execute(
      "SELECT tenant_id FROM tenant WHERE email = ? OR soDienThoai = ?",
      [email, soDienThoai]
    );
    
    if (existingTenant.length > 0) {
      throw Object.assign(new Error("Email hoặc số điện thoại đã tồn tại"), { statusCode: 400 });
    }

    const [existingMST] = await connection.execute(
      "SELECT tenant_id FROM tenant WHERE maSoThue = ?",
      [maSoThue]
    );
    
    if (existingMST.length > 0) {
      throw Object.assign(new Error("Mã số thuế đã tồn tại"), { statusCode: 400 });
    }

    const result = await tenantModel.createTenant(connection, {
      tenBanQuanLy,
      diaChi: diachi,      
      soDienThoai,
      email,
      maSoThue,
      tenCongTy: tenCongTy ?? null,
      nguoiDaiDien: nguoiDaiDien ?? null,
      chucVu: chucVu ?? null,
      giayPhepKinhDoanh: giayPhepKinhDoanh ?? null,
      ngayCapPhep: ngayCapPhep ?? null,
      noiCapPhep: noiCapPhep ?? null,
    });

    const tenant_id = result.insertId;

    const [existingAdmin] = await connection.execute(
      "SELECT user_id FROM users WHERE email = ?",
      [admin.email]
    );
    
    if (existingAdmin.length > 0) {
      throw Object.assign(new Error("Email admin đã tồn tại trong hệ thống"), { statusCode: 400 });
    }

    const [roles] = await connection.execute(
      "SELECT role_id FROM role WHERE tenVaiTro = ?",
      ["tenant_admin"]
    );
    
    if (roles.length === 0) {
      throw Object.assign(new Error("Role TenantAdmin không tồn tại"), { statusCode: 500 });
    }

    const role_id = roles[0].role_id;
    const password_hash = await bcrypt.hash(admin.password, SALT_ROUNDS);

    await connection.execute(
      `INSERT INTO users (
        tenant_id, role_id, email, password_hash, 
        hoTen, soDienThoai, trangThai
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [tenant_id, role_id, admin.email, password_hash, admin.hoTen, admin.soDienThoai, "active"]
    );

    const marketResults = { created: [], errors: [] };
    
    for (const m of markets) {
      const tenCho = String(m.tenCho || "").trim();
      if (!tenCho) continue;

      try {
        const [marketResult] = await connection.execute(
          `INSERT INTO market (tenant_id, tenCho, diaChi, dienTich) 
           VALUES (?, ?, ?, ?)`,
          [tenant_id, tenCho, m.diaChi || null, m.dienTich ? Number(m.dienTich) : null]
        );
        marketResults.created.push({ market_id: marketResult.insertId, tenCho });
      } catch (e) {
        marketResults.errors.push({ tenCho, message: e.message });
      }
    }

    await connection.commit();
    
    return { tenant_id, marketResults };
    
  } catch (error) {
    await connection.rollback();
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
  const {
    tenBanQuanLy,
    diachi,
    soDienThoai,
    email,
    maSoThue,
    tenCongTy,
    nguoiDaiDien,
    chucVu,
    giayPhepKinhDoanh,
    ngayCapPhep,
    noiCapPhep,
  } = body;

  if (!email || !diachi || !tenBanQuanLy || !soDienThoai) {
    throw Object.assign(new Error("Missing required fields"), { statusCode: 400 });
  }

  const existing = await tenantModel.getTenantById(id);
  if (!existing) {
    throw Object.assign(new Error("Tenant not found"), { statusCode: 404 });
  }

  const duplicate = await tenantModel.checkDuplicateForUpdate(id, email, soDienThoai, maSoThue);
  if (duplicate.length > 0) {
    throw Object.assign(new Error("Email, SĐT hoặc MST đã tồn tại"), { statusCode: 400 });
  }

  const updateData = {
    tenBanQuanLy,
    diachi,
    soDienThoai,
    email,
    maSoThue,
    tenCongTy: tenCongTy ?? null,      
    nguoiDaiDien: nguoiDaiDien ?? null,
    chucVu: chucVu ?? null,
    giayPhepKinhDoanh: giayPhepKinhDoanh ?? null,
    ngayCapPhep: ngayCapPhep ?? null,
    noiCapPhep: noiCapPhep ?? null,
  };

  await tenantModel.updateTenantInfo(id, updateData);
};