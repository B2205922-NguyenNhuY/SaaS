const superAdminModel = require("../models/super_admin.model");
const roleModel = require("../models/role.model");

const bcrypt = require("bcrypt");

const { ROLE_CREATE_PERMISSION, ROLES } = require("../constants/role");

const SALT_ROUNDS = 10;
//Tạo super admin mới
exports.createSuperAdmin = async (creator, body) => {
    const creatorRole = creator.role;
    const {
        email,
        password,
        hoTen,
        soDienThoai,
        role_id,
        trangThai,
    } = body;

        if (!email || !password || !hoTen || !soDienThoai) {
            throw Object.assign(
                new Error("Missing required fields"),
                { statusCode: 400 }
            );
        }

    const roleToCreate = await roleModel.getRoleById(role_id);

    if (!roleToCreate) {
      throw Object.assign(
        new Error("Role không tồn tại"),
        { statusCode: 400 }
      );
    }

    const allowedRoles = ROLE_CREATE_PERMISSION[creatorRole] || [];

    if (!allowedRoles.includes(roleToCreate.tenVaiTro)) {
      throw Object.assign(
        new Error(`Role ${creatorRole} không được phép tạo ${roleToCreate.tenVaiTro}`),
        { statusCode: 403 }
      );
    }

    const duplicate = await superAdminModel.checkDuplicate(email, soDienThoai);

    if (duplicate.length > 0) {
      throw Object.assign(
        new Error("Email hoặc SĐT đã tồn tại"),
        { statusCode: 400 }
      );
    }

    const password_hash = await bcrypt.hash(password, SALT_ROUNDS);

    const result = await superAdminModel.createSuperAdmin({
      email,
      password_hash,
      hoTen,
      soDienThoai,
      trangThai: trangThai || "active",
    });

    return {
      admin_id: result.insertId,
    };
};

//Lấy tất cả super admin
exports.getAllSuperAdmins = async () => {
        return await superAdminModel.getAllSuperAdmins();
};

//Lấy Super Admin theo ID
exports.getSuperAdminById = async (id) => {
        const result = await superAdminModel.getSuperAdminById(id);

        if(!result) {
            throw Object.assign(
                new Error("Super Admin not found"),
                { statusCode: 404 }
            );
        }

        return result;
};

//Đổi mật khẩu
exports.changePassword = async (id, newPassword) => {
    if (!newPassword) {
      throw Object.assign(
        new Error("New password required"),
        { statusCode: 400 }
      );
    }

    const password_hash = await bcrypt.hash(newPassword, SALT_ROUNDS);

    await superAdminModel.updatePassword(id, password_hash);

};


//Update Super Admin
exports.updateSuperAdminStatus = async(id, trangThai) => {
        if(!["active", "suspended"].includes(trangThai)) {
            throw Object.assign(
                new Error("Invalid status"),
                { statusCode: 400 }
            );
        }

        const existing = await superAdminModel.getSuperAdminById(id);

        if(!existing){
           throw Object.assign(
            new Error("Super Admin not found"),
            { statusCode: 404 }
           );
        }

        await superAdminModel.updateSuperAdminStatus(id, trangThai);
};

//Update thông tin Tenant
exports.updateSuperAdminInfo = async (id, body) => {
        const {soDienThoai, email} = body;

        const existing = await superAdminModel.getSuperAdminById(id);

        if(!existing) {
            throw Object.assign(
                new Error("Super Admin not found"),
                { statusCode: 404 }
            );
        }

        const duplicate = await superAdminModel.checkDuplicateForUpdate(id, email, soDienThoai);

        if(duplicate.length>0) {
            throw Object.assign(
                new Error("Email hoặc SĐT đã tồn tại"),
                { statusCode: 400 }
            );
        }

        await superAdminModel.updateSuperAdminInfo(id, body);
};
