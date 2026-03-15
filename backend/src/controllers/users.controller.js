const bcrypt = require("bcrypt");
const userModel = require("../models/users.model");
const roleModel = require("../models/role.model");
const tenantModel = require("../models/tenant.model");
const {
  ROLE_CREATE_PERMISSION,
  ROLES,
  normalizeRole,
} = require("../constants/role");
const { assertUserQuota } = require("../utils/quota");
const { logAudit } = require("../utils/audit");
const SALT_ROUNDS = 10;

exports.createUser = async (req, res) => {
  try {
    const creatorRole = normalizeRole(req.user.role);
    const roleIDToCreate = req.body.role_id;
    const roleToCreate = await roleModel.getRoleById(roleIDToCreate);
    if (!roleToCreate)
      return res.status(400).json({ message: "Role không tồn tại" });
    const targetRole = normalizeRole(roleToCreate.tenVaiTro);
    const allowedRoles = ROLE_CREATE_PERMISSION[creatorRole] || [];
    if (!allowedRoles.includes(targetRole))
      return res
        .status(403)
        .json({
          message: `Role ${creatorRole} không được phép tạo ${targetRole}`,
        });

    const { email, password, hoTen, soDienThoai, tenant_id, trangThai } =
      req.body;
    if (!email || !password || !hoTen || !soDienThoai)
      return res.status(400).json({ message: "Missing required fields" });
    const finalTenantId =
      creatorRole === ROLES.SUPER_ADMIN
        ? Number(tenant_id)
        : Number(req.user.tenant_id);
    if (!finalTenantId)
      return res.status(400).json({ message: "tenant_id is required" });
    const tenant = await tenantModel.getTenantById(finalTenantId);
    if (!tenant)
      return res.status(404).json({ message: "Tenant không tồn tại" });

    const duplicate = await userModel.checkDuplicate(
      email,
      soDienThoai,
      finalTenantId,
    );
    if (duplicate.length > 0)
      return res
        .status(409)
        .json({ message: "Email hoặc Số điện thoại đã tồn tại" });
    if (creatorRole !== ROLES.SUPER_ADMIN) await assertUserQuota(finalTenantId);

    const password_hash = await bcrypt.hash(password, SALT_ROUNDS);
    const result = await userModel.createUser({
      email,
      password_hash,
      hoTen,
      soDienThoai,
      tenant_id: finalTenantId,
      role_id: roleIDToCreate,
      trangThai: trangThai || "active",
    });
    await logAudit(req, {
      action: "CREATE_USER",
      entity_type: "users",
      entity_id: result.insertId,
      newValue: {
        email,
        hoTen,
        soDienThoai,
        tenant_id: finalTenantId,
        role_id: roleIDToCreate,
        trangThai: trangThai || "active",
      },
    });
    res
      .status(201)
      .json({ message: "User created successfully", user_id: result.insertId });
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
};

exports.getUserById = async (req, res) => {
  try {
    const user = await userModel.getUserById(req.params.id);
    if (!user || user.trangThai === "deleted")
      return res.status(404).json({ message: "User not found" });
    if (
      normalizeRole(req.user.role) !== ROLES.SUPER_ADMIN &&
      Number(user.tenant_id) !== Number(req.user.tenant_id)
    )
      return res.status(403).json({ message: "Forbidden" });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getUsersByTenant = async (req, res) => {
  try {
    if (normalizeRole(req.user.role) === ROLES.SUPER_ADMIN)
      return res.json(
        await userModel.getAllUsersPaged(req.pagination, req.query),
      );
    return res.json(
      await userModel.getUsersByTenant(req.user.tenant_id, req.pagination),
    );
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const id = Number(req.body.user_id || req.user.id);
    const { newPassword } = req.body;
    if (!newPassword)
      return res.status(400).json({ message: "New password required" });
    const password_hash = await bcrypt.hash(newPassword, SALT_ROUNDS);
    await userModel.updatePassword(id, password_hash);
    await logAudit(req, {
      action: "CHANGE_PASSWORD",
      entity_type: "users",
      entity_id: id,
      newValue: { changed: true },
    });
    res.json({ message: "Password updated successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateUserStatus = async (req, res) => {
  try {
    const { trangThai } = req.body;
    if (!["active", "suspended"].includes(trangThai))
      return res.status(400).json({ message: "Invalid status" });
    const existing = await userModel.getUserById(req.params.id);
    if (!existing) return res.status(404).json({ message: "User not found" });
    await userModel.updateUserStatus(req.params.id, trangThai);
    await logAudit(req, {
      action: "UPDATE_USER_STATUS",
      entity_type: "users",
      entity_id: Number(req.params.id),
      oldValue: existing,
      newValue: { ...existing, trangThai },
    });
    res.json({ message: "User status updated successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateUserInfo = async (req, res) => {
  try {
    const existing = await userModel.getUserById(req.params.id);
    if (!existing) return res.status(404).json({ message: "User not found" });
    const tenantScope =
      normalizeRole(req.user.role) === ROLES.SUPER_ADMIN
        ? null
        : req.user.tenant_id;
    const duplicate = await userModel.checkDuplicateForUpdate(
      req.params.id,
      req.body.email || existing.email,
      req.body.soDienThoai || existing.soDienThoai,
      tenantScope,
    );
    if (duplicate.length > 0)
      return res
        .status(409)
        .json({ message: "Email hoặc Số điện thoại đã tồn tại" });
    await userModel.updateUserInfo(req.params.id, req.body);
    await logAudit(req, {
      action: "UPDATE_USER",
      entity_type: "users",
      entity_id: Number(req.params.id),
      oldValue: existing,
      newValue: { ...existing, ...req.body },
    });
    res.json({ message: "User updated successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
