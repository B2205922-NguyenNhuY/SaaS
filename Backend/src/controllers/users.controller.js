const userService = require("../services/users.service");
const { logAudit } = require("../utils/audit");

//Tạo user mới
exports.createUser = async (req, res, next) => {
  try {
    const result = await userService.createUser(req.user, req.body);

    await logAudit(req, {
      action: "CREATE_USER",
      entity_type: "user",
      entity_id: result.user_id,
      newValue: req.body,
    });

    res.status(201).json({
      message: "User created successfully",
      user_id: result.user_id,
    });
  } catch (error) {
    next(error);
  }
};

//Lấy tất cả User
exports.getAllUsers = async (req, res, next) => {
    try {
        const rows = await userService.getAllUsers();

        res.json(rows);

    } catch (error) {
        next(error);
    }
};

//Lấy User theo ID
exports.getUserById = async (req, res, next) => {
    try{
        const user = await userService.getUserById(req.user, req.params.id);

        res.json(user);
        
    } catch (error) {
        next(error);
    }
};

//Lấy user theo Tenant
exports.getUsersByTenant = async (req, res, next) => {
  try {
    const filters = {
      tenant_id: req.user.tenant_id,
      keyword: req.query.keyword,
      role_id: req.query.role_id,
      trangThai: req.query.trangThai,
      page: Number(req.query.page) || 1,
      limit: Number(req.query.limit) || 10,
      sortBy: req.query.sortBy || "created_at",
      sortOrder: req.query.sortOrder || "DESC"
    };
    
    const users = await userService.getUsersByTenant(req.user);

    res.json(users);

  } catch (error) {
    next(error);
  }
};

//Đổi mật khẩu
exports.changePassword = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const { newPassword } = req.body;
    
    console.log('Change password request:', { id, newPassword: !!newPassword }); // Debug
    
    if (!newPassword) {
      return res.status(400).json({ message: "Vui lòng nhập mật khẩu mới" });
    }
    
    if (newPassword.length < 6) {
      return res.status(400).json({ message: "Mật khẩu phải có ít nhất 6 ký tự" });
    }
    
    const old = await userService.getUserById(req.user, id);
    
    await userService.updatePassword(id, newPassword);
    
    await logAudit(req, {
      action: "CHANGE_PASSWORD",
      entity_type: "user",
      entity_id: id,
      oldValue: { password: "******" },
      newValue: { password: "******" },
    });
    
    res.json({
      message: "Password updated successfully",
    });
  } catch (error) {
    console.error('Change password error:', error);
    next(error);
  }
};

exports.listUsers = async (req, res, next) => {
  try {

    const filters = {
      tenant_id: req.query.tenant_id,
      role_id: req.query.role_id,
      trangThai: req.query.trangThai,
      keyword: req.query.keyword,
      created_from: req.query.created_from,
      created_to: req.query.created_to,
      page: Number(req.query.page) || 1,
      limit: Number(req.query.limit) || 10,
      sortBy: req.query.sortBy || "created_at",
      sortOrder: req.query.sortOrder || "DESC"
    };

    const result = await userService.listUsers(filters);

    res.json(result);

  } catch (error) {
    next(error);
  }
};

//Update User
exports.updateUserStatus = async(req, res, next) => {
    try{
        const id = Number(req.params.id);
        const old = await userService.getUserById(req.user, id);

        await userService.updateUserStatus(req.params.id, req.body.trangThai);

        await logAudit(req, {
          action: "UPDATE_USER_STATUS",
          entity_type: "user",
          entity_id: id,
          oldValue: old,
          newValue: { ...old, trangThai: req.body.trangThai },
        });
        
        res.json({message: "User status updated susscessfully"});
    } catch (error) {
        next(error);
    }
};

//Update thông tin Tenant
exports.updateUserInfo = async (req, res, next) => {
    try {
        const id = Number(req.params.id);
        const old = await userService.getUserById(req.user, id);

        await userService.updateUserInfo(req.params.id, req.body);

        await logAudit(req, {
          action: "UPDATE_USER",
          entity_type: "user",
          entity_id: id,
          oldValue: old,
          newValue: { ...old, ...req.body },
        });
        
        res.json({message: "User updated successfully"});
    } catch (error) {
        next(error);
    }
};

//Soft delete
exports.deleteUser = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const old = await userService.getUserById(req.user, id);

    await userService.deleteUser(req.params.id);

    await logAudit(req, {
      action: "DELETE_USER",
      entity_type: "user",
      entity_id: id,
      oldValue: old,
      newValue: { deleted: true },
    });

    res.json({
      message: "User deleted successfully",
    });

  } catch (error) {
    next(error);
  }
};