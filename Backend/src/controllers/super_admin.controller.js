const superAdminService = require("../services/super_admin.service");
//Tạo super admin mới
exports.createSuperAdmin = async (req, res, next) => {
  try {
    const result = await superAdminService.createSuperAdmin(req.user, req.body);

    res.status(201).json({
      message: "Super Admin created successfully",
      admin_id: result.admin_id,
    });
  } catch (error) {
    next(error);
  }
};

//Lấy tất cả super admin
exports.getAllSuperAdmins = async (req, res, next) => {
    try {
        const rows = await superAdminService.getAllSuperAdmins();

        res.json(rows);

    } catch (error) {
        next(error);
    }
};

//Lấy Super Admin theo ID
exports.getSuperAdminById = async (req, res, next) => {
    try{
        const result = await superAdminService.getSuperAdminById(req.params.id);

        res.json(result);
        
    } catch (error) {
        next(error);
    }
};

//Đổi mật khẩu
exports.changePassword = async (req, res, next) => {
  try {
    await superAdminService.updatePassword(req.params.id, req.body.password_hash);

    res.json({
      message: "Password updated successfully",
    });

  } catch (error) {
    next(error)
  }
};


//Update Super Admin
exports.updateSuperAdminStatus = async(req, res, next) => {
    try{
        await superAdminService.updateSuperAdminStatus(req.params.id, req.body.trangThai);

        res.json({message: "SuperAdmin status updated susscessfully"});
    } catch (error) {
        next(error);
    }
};

//Update thông tin Tenant
exports.updateSuperAdminInfo = async (req, res, next) => {
    try {
        await superAdminService.updateSuperAdminInfo(req.params.id, req.body);

        res.json({message: "Super Admin updated successfully"});
    } catch (error) {
        next(error);
    }
};
