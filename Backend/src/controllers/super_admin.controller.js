const superAdminService = require("../services/super_admin.service");
const { logAudit } = require("../utils/audit");

//Tạo super admin mới
exports.createSuperAdmin = async (req, res, next) => {
  try {
    const result = await superAdminService.createSuperAdmin(req.user, req.body);

    await logAudit(req, {
      action: "CREATE_SUPER_ADMIN",
      entity_type: "super_admin",
      entity_id: result.admin_id,
      newValue: req.body,
    });

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
    const id = Number(req.params.id);

    await superAdminService.updatePassword(req.params.id, req.body.password_hash);

    await logAudit(req, {
      action: "CHANGE_SUPER_ADMIN_PASSWORD",
      entity_type: "super_admin",
      entity_id: id,
      oldValue: { password: "******" },
      newValue: { password: "******" },
    });

    res.json({
      message: "Password updated successfully",
    });

  } catch (error) {
    next(error)
  }
};

exports.listSuperAdmins = async (req, res, next) => {
  try {

    const filters = {
      keyword: req.query.keyword,
      trangThai: req.query.trangThai,
      created_from: req.query.created_from,
      created_to: req.query.created_to,
      page: Number(req.query.page) || 1,
      limit: Number(req.query.limit) || 10,
      sortBy: req.query.sortBy || "created_at",
      sortOrder: req.query.sortOrder || "DESC"
    };

    const result = await superAdminService.listSuperAdmins(filters);

    res.json(result);

  } catch (error) {
    next(error);
  }
};


//Update Super Admin
exports.updateSuperAdminStatus = async(req, res, next) => {
    try{
        const id = Number(req.params.id);

        const old = await superAdminService.getSuperAdminById(id);

        await superAdminService.updateSuperAdminStatus(req.params.id, req.body.trangThai);

        await logAudit(req, {
          action: "UPDATE_SUPER_ADMIN_STATUS",
          entity_type: "super_admin",
          entity_id: id,
          oldValue: old,
          newValue: { ...old, trangThai: req.body.trangThai },
        });
        
        res.json({message: "SuperAdmin status updated susscessfully"});
    } catch (error) {
        next(error);
    }
};

//Update thông tin Tenant
exports.updateSuperAdminInfo = async (req, res, next) => {
    try {
        const id = Number(req.params.id);

        const old = await superAdminService.getSuperAdminById(id);

        await superAdminService.updateSuperAdminInfo(req.params.id, req.body);

        await logAudit(req, {
          action: "UPDATE_SUPER_ADMIN",
          entity_type: "super_admin",
          entity_id: id,
          oldValue: old,
          newValue: { ...old, ...req.body },
        });
        
        res.json({message: "Super Admin updated successfully"});
    } catch (error) {
        next(error);
    }
};
