const userModel             = require("../models/users.model");
const roleModel             = require("../models/role.model");
const tenantModel           = require("../models/tenant.model");
const planSubscriptionModel = require("../models/plan_subscription.model");
const bcrypt                = require("bcrypt");

const { ROLE_CREATE_PERMISSION, ROLES } = require("../constants/role");

const SALT_ROUNDS = 10;

exports.createUser = async (creator, body) => {
  const creatorRole     = creator.role;
  const creatorTenantId = creator.tenant_id;

  const { email, password, hoTen, soDienThoai, tenant_id, role_id, trangThai } = body;

  if (!email || !password || !hoTen || !soDienThoai) {
    throw Object.assign(new Error("Missing required fields"), { statusCode: 400 });
  }

  const roleToCreate = await roleModel.getRoleById(role_id);
  if (!roleToCreate) {
    throw Object.assign(new Error("Role không tồn tại"), { statusCode: 400 });
  }

  const allowedRoles = ROLE_CREATE_PERMISSION[creatorRole] || [];
  if (!allowedRoles.includes(roleToCreate.tenVaiTro)) {
    throw Object.assign(
      new Error(`Role ${creatorRole} không được phép tạo ${roleToCreate.tenVaiTro}`),
      { statusCode: 403 }
    );
  }

  let finalTenantId;
  if (creatorRole === ROLES.SUPER_ADMIN) {
    if (!tenant_id) throw Object.assign(new Error("tenant_id is required"), { statusCode: 400 });
    finalTenantId = tenant_id;
  } else {
    finalTenantId = creatorTenantId;
  }

  const tenant = await tenantModel.getTenantById(finalTenantId);
  if (!tenant) throw Object.assign(new Error("Tenant không tồn tại"), { statusCode: 404 });

  const duplicate = roleToCreate.tenVaiTro === "tenant_admin"
    ? await userModel.checkDuplicateAdmin(email, soDienThoai)
    : await userModel.checkDuplicate(null, email, soDienThoai, finalTenantId);

  if (duplicate.length > 0) {
    throw Object.assign(new Error("Email hoặc SĐT đã tồn tại"), { statusCode: 400 });
  }

  if (creatorRole !== ROLES.SUPER_ADMIN) {
    const totalAccounts = await userModel.countAccountsByTenant(finalTenantId);
    const plan = await planSubscriptionModel.getPlanByTenantSubscribed(finalTenantId);

    if (!plan || !plan[0]) {
      throw Object.assign(new Error("Subscription không hợp lệ hoặc hết hạn"), { statusCode: 403 });
    }

    if (totalAccounts >= plan[0].gioiHanUser) {
      throw Object.assign(new Error("Đã vượt quá số lượng user cho phép của gói"), { statusCode: 400 });
    }
  }

  const password_hash = await bcrypt.hash(password, SALT_ROUNDS);

  const result = await userModel.createUser(null, {
    email, password_hash, hoTen, soDienThoai,
    tenant_id: finalTenantId, role_id,
    trangThai: trangThai || "active",
  });

  return { user_id: result.insertId };
};

exports.getAllUsers = async () => {
  return userModel.getAllUsers();
};

exports.getUserById = async (currentUser, id) => {
  const user = await userModel.getUserById(Number(id));
  if (!user) {
    throw Object.assign(new Error("User not found"), { statusCode: 404 });
  }
  if (currentUser.role !== ROLES.SUPER_ADMIN && user.tenant_id !== currentUser.tenant_id) {
    throw Object.assign(new Error("Forbidden"), { statusCode: 403 });
  }
  return user;
};

exports.getUsersByTenant = async (filters) => {
  const page   = Number(filters.page)  || 1;
  const limit  = Number(filters.limit) || 10;
  const offset = (page - 1) * limit;

  const rows  = await userModel.getUsersByTenant(filters, offset, limit);
  const total = await userModel.countUsersByTenant(filters);

  return {
    data: rows,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
};

exports.listUsers = async (filters) => {
  const page   = Number(filters.page)  || 1;
  const limit  = Number(filters.limit) || 10;
  const offset = (page - 1) * limit;

  const rows  = await userModel.listUsers(filters, offset, limit);
  const total = await userModel.countUsers(filters);

  return {
    data: rows,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
};

exports.updatePassword = async (id, newPassword) => {
  if (!newPassword) throw Object.assign(new Error("New password required"), { statusCode: 400 });
  if (newPassword.length < 6) throw Object.assign(new Error("Mật khẩu phải có ít nhất 6 ký tự"), { statusCode: 400 });

  const password_hash = await bcrypt.hash(newPassword, SALT_ROUNDS);
  await userModel.updatePassword(Number(id), password_hash);
};

exports.updateUserStatus = async (id, trangThai) => {
  if (!["active", "suspended", "deleted"].includes(trangThai)) {
    throw Object.assign(new Error("Invalid status"), { statusCode: 400 });
  }
  const existing = await userModel.getUserById(Number(id));
  if (!existing) throw Object.assign(new Error("User not found"), { statusCode: 404 });
  await userModel.updateUserStatus(Number(id), trangThai);
};

exports.updateUserInfo = async (id, body) => {
  const { email, soDienThoai } = body;

  const existing = await userModel.getUserById(Number(id));
  if (!existing) throw Object.assign(new Error("User not found"), { statusCode: 404 });

  const duplicate = await userModel.checkDuplicateForUpdate(Number(id), email, soDienThoai);
  if (duplicate.length > 0) {
    throw Object.assign(new Error("Email hoặc SĐT đã tồn tại"), { statusCode: 400 });
  }

  await userModel.updateUserInfo(Number(id), body);
};

exports.deleteUser = async (id) => {
  await userModel.softDelete(Number(id));
};