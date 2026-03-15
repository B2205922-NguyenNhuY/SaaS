const userService = require("../services/users.service");
//Tạo user mới
exports.createUser = async (req, res, next) => {
  try {
    const result = await userService.createUser(req.user, req.body);

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
    const users = await userService.getUsersByTenant(req.user);

    res.json(users);

  } catch (error) {
    next(error);
  }
};

//Đổi mật khẩu
exports.changePassword = async (req, res, next) => {
  try {
    await userService.updatePassword(req.params.id, req.body.newPassword);

    res.json({
      message: "Password updated successfully",
    });

  } catch (error) {
    next(error);
  }
};


//Update User
exports.updateUserStatus = async(req, res, next) => {
    try{
        await userService.updateUserStatus(req.params.id, req.body.trangThai);

        res.json({message: "User status updated susscessfully"});
    } catch (error) {
        next(error);
    }
};

//Update thông tin Tenant
exports.updateUserInfo = async (req, res, next) => {
    try {
        await userService.updateUserInfo(req.params.id, req.body);

        res.json({message: "User updated successfully"});
    } catch (error) {
        next(error);
    }
};

//Soft delete
exports.deleteUser = async (req, res, next) => {
  try {
    await userService.deleteUser(req.params.id);

    res.json({
      message: "User deleted successfully",
    });

  } catch (error) {
    next(error);
  }
};