const userService = require("../services/users.service");
const { logAudit } = require("../utils/audit");

exports.createUser = async (req, res, next) => {
  try {
    const result = await userService.createUser(req.user, req.body);
    await logAudit(req, {
      action: "CREATE_USER", entity_type: "user",
      entity_id: result.user_id, newValue: req.body,
    });
    res.status(201).json({ message: "User created successfully", user_id: result.user_id });
  } catch (error) { next(error); }
};

exports.getAllUsers = async (req, res, next) => {
  try {
    res.json(await userService.getAllUsers());
  } catch (error) { next(error); }
};

exports.getUserById = async (req, res, next) => {
  try {
    res.json(await userService.getUserById(req.user, Number(req.params.id)));
  } catch (error) { next(error); }
};

exports.getUsersByTenant = async (req, res, next) => {
  try {
    const filters = {
      tenant_id: req.user.tenant_id,
      keyword:   req.query.keyword,
      role_id:   req.query.role_id,
      trangThai: req.query.trangThai,
      page:      Number(req.query.page)  || 1,
      limit:     Number(req.query.limit) || 10,
      sortBy:    req.query.sortBy    || "created_at",
      sortOrder: req.query.sortOrder || "DESC",
    };
    res.json(await userService.getUsersByTenant(filters));
  } catch (error) { next(error); }
};

exports.listUsers = async (req, res, next) => {
  try {
    const filters = {
      tenant_id:    req.query.tenant_id,
      role_id:      req.query.role_id,
      trangThai:    req.query.trangThai,
      keyword:      req.query.keyword,
      created_from: req.query.created_from,
      created_to:   req.query.created_to,
      page:         Number(req.query.page)  || 1,
      limit:        Number(req.query.limit) || 10,
      sortBy:       req.query.sortBy    || "created_at",
      sortOrder:    req.query.sortOrder || "DESC",
    };
    res.json(await userService.listUsers(filters));
  } catch (error) { next(error); }
};

exports.changePassword = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    await userService.getUserById(req.user, id);
    await userService.updatePassword(id, req.body.newPassword);
    await logAudit(req, {
      action: "CHANGE_PASSWORD", entity_type: "user", entity_id: id,
      oldValue: { password: "******" }, newValue: { password: "******" },
    });
    res.json({ message: "Password updated successfully" });
  } catch (error) { next(error); }
};

exports.updateUserStatus = async (req, res, next) => {
  try {
    const id  = Number(req.params.id);
    const old = await userService.getUserById(req.user, id);
    await userService.updateUserStatus(id, req.body.trangThai);
    await logAudit(req, {
      action: "UPDATE_USER_STATUS", entity_type: "user", entity_id: id,
      oldValue: old, newValue: { ...old, trangThai: req.body.trangThai },
    });
    res.json({ message: "User status updated successfully" });
  } catch (error) { next(error); }
};

exports.updateUserInfo = async (req, res, next) => {
  try {
    const id  = Number(req.params.id);
    const old = await userService.getUserById(req.user, id);
    await userService.updateUserInfo(id, req.body);
    await logAudit(req, {
      action: "UPDATE_USER", entity_type: "user", entity_id: id,
      oldValue: old, newValue: { ...old, ...req.body },
    });
    res.json({ message: "User updated successfully" });
  } catch (error) { next(error); }
};

exports.deleteUser = async (req, res, next) => {
  try {
    const id  = Number(req.params.id);
    const old = await userService.getUserById(req.user, id);
    await userService.deleteUser(id);
    await logAudit(req, {
      action: "DELETE_USER", entity_type: "user", entity_id: id,
      oldValue: old, newValue: { deleted: true },
    });
    res.json({ message: "User deleted successfully" });
  } catch (error) { next(error); }
};