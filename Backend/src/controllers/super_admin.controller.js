const superAdminModel = require("../models/super_admin.model");
const roleModel = require("../models/role.model");
const bcrypt = require("bcrypt");
const { ROLE_CREATE_PERMISSION, ROLES } = require("../constants/role");

const SALT_ROUNDS = 10;
//Tạo super admin mới
exports.createSuperAdmin = async (req, res) => {
  try {
    const creatorRole = req.user.role;

    const roleIDToCreate = req.body.role_id;

    const roleToCreate = await roleModel.getRoleById(roleIDToCreate);

    if (!roleToCreate) {
      return res.status(400).json({
        message: "Role không tồn tại",
      });
    }

    const allowedRoles = ROLE_CREATE_PERMISSION[creatorRole] || [];

    if (!allowedRoles.includes(roleToCreate.tenVaiTro)) {
      return res.status(403).json({
        message: `Role ${creatorRole} không được phép tạo ${roleToCreate.tenVaiTro}`,
      });
    }

    const {
      email,
      password,
      hoTen,
      soDienThoai,
      trangThai,
    } = req.body;

    if (!email || !password || !hoTen || !soDienThoai) {
      return res.status(400).json({
        message: "Missing required fields",
      });
    }

    const duplicate = await superAdminModel.checkDuplicate(email, soDienThoai);

    if (duplicate.length > 0) {
      return res.status(400).json({
        message: "Email hoặc Số điện thoại đã tồn tại",
      });
    }

    const password_hash = await bcrypt.hash(password, SALT_ROUNDS);

    const result = await superAdminModel.createSuperAdmin({
      email,
      password_hash,
      hoTen,
      soDienThoai,
      trangThai: trangThai || "active",
    });

    res.status(201).json({
      message: "Super Admin created successfully",
      admin_id: result.insertId,
    });
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return res
        .status(400)
        .json({ message: "Email hoặc số điện thoại đã tồn tại" });
    }

    res.status(500).json({ error: error.message });
  }
};

//Lấy tất cả super admin
exports.getAllSuperAdmins = async (req, res) => {
    try {
        const [rows] = await superAdminModel.getAllSuperAdmins();

        res.json(rows);

    } catch (error) {
        res.status(500).json({error: error.message});
    }
};

//Lấy Super Admin theo ID
exports.getSuperAdminById = async (req, res) => {
    try{
        const { id } = req.params;

        const result = await superAdminModel.getSuperAdminById(id);

        if(!result) {
            return res.status(404).json({message: "Admin not found"});
        }

        res.json(result);
        
    } catch (error) {
        res.status(500).json({error: error.message});
    }
};

//Đổi mật khẩu
exports.changePassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    if (!newPassword) {
      return res.status(400).json({
        message: "New password required",
      });
    }

    const password_hash = await bcrypt.hash(newPassword, SALT_ROUNDS);

    await superAdminModel.updatePassword(id, password_hash);

    res.json({
      message: "Password updated successfully",
    });

  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
};


//Update Super Admin
exports.updateSuperAdminStatus = async(req, res) => {
    try{
        const { id } = req.params;
        const { trangThai } = req.body;

        if(!["active", "suspended"].includes(trangThai)) {
            return res.status(400).json({
                message: "Invalid status"
            });
        }

        const existing = await superAdminModel.getSuperAdminById(id);

        if(!existing){
            return res.status(400).json({message: "Super Admin not found"});
        }

        await superAdminModel.updateSuperAdminStatus(id, trangThai);

        res.json({message: "SuperAdmin status updated susscessfully"});
    } catch (error) {
        res.status(500).json({error: error.message});
    }
};

//Update thông tin Tenant
exports.updateSuperAdminInfo = async (req, res) => {
    try {
        const { id } = req.params;
        const {hoTen, soDienThoai, email} = req.body;

        const existing = await superAdminModel.getSuperAdminById(id);

        if(!existing) {
            return res.status(404).json({message: "Super Admin not found"});
        }

        const duplicate = await superAdminModel.checkDuplicateForUpdate(id, email, soDienThoai);

        if(duplicate.length>0) {
            return res.status(400).json({
                message: "Email hoặc Số điện thoại đã tồn tại"
            });
        }

        await superAdminModel.updateSuperAdminInfo(id, req.body);

        res.json({message: "Super Admin updated successfully"});
    } catch (error) {
        res.status(500).json({error: error.message});
    }
};
