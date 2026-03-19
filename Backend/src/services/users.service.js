const userModel = require("../models/users.model");
const roleModel = require("../models/role.model");
const tenantModel = require("../models/tenant.model");
const planSubscriptionModel = require("../models/plan_subscription.model");

const bcrypt = require("bcrypt");

const { ROLE_CREATE_PERMISSION, ROLES } = require("../constants/role");

const SALT_ROUNDS = 10;
//Tạo user mới
exports.createUser = async (creator, body) => {
    const creatorRole = creator.role;
    const creatorTenantId = creator.tenant_id;

    const {
        email,
        password,
        hoTen,
        soDienThoai,
        tenant_id,
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

    let finalTenantId;

    if (creatorRole === ROLES.SUPER_ADMIN) {
      if (!tenant_id) {
        throw Object.assign(
            new Error("tenant_id is required"),
            { statusCode: 400 }
        );
      }
      finalTenantId = tenant_id;
    } else {
      // Tenant admin bị ép tenant
      finalTenantId = creatorTenantId;
    }

    const tenant = await tenantModel.getTenantById(finalTenantId);

    if (!tenant) {
      throw Object.assign(
        new Error("Tenant không tồn tại"),
        { statusCode: 404 }
      );
    }

    let duplicate;

    if (roleToCreate.tenVaiTro === "tenant_admin") {
      duplicate = await userModel.checkDuplicateAdmin(email, soDienThoai);
    } else {
      duplicate = await userModel.checkDuplicate(
        null,
        email,
        soDienThoai,
        finalTenantId
      );
    }

    if (duplicate.length > 0) {
      throw Object.assign(
        new Error("Email hoặc SĐT đã tồn tại"),
        { statusCode: 400 }
      );
    }

    if (creatorRole !== ROLES.SUPER_ADMIN) {
      const totalAccounts = await userModel.countAccountsByTenant(finalTenantId);

      const plan = await planSubscriptionModel.getPlanByTenantSubscribed(finalTenantId);

      if (!plan) {
        throw Object.assign(
            new Error("Subscription không hợp lệ hoặc hết hạn"),
            { statusCode: 403 }
        );
      }

      if (totalAccounts >= plan[0].gioiHanUser) {
        throw Object.assign(
            new Error("Đã vượt quá số lượng user cho phép của gói"),
            { statusCode: 400 }
        );
      }
    }

    const password_hash = await bcrypt.hash(password, SALT_ROUNDS);

    const result = await userModel.createUser(null,{
      email,
      password_hash,
      hoTen,
      soDienThoai,
      tenant_id: finalTenantId,
      role_id,
      trangThai: trangThai || "active",
    });

    return{user_id: result.insertId};
};

//Lấy tất cả User
exports.getAllUsers = async () => {
        return await userModel.getAllUsers();

};

//Lấy User theo ID
exports.getUserById = async (currentUser, id) => {
        const user = await userModel.getUserById(id);

        if(!user) {
            throw Object.assign(
                new Error("User not found"),
                { statusCode: 404 }
            );
        }

        if(currentUser.role !== ROLES.SUPER_ADMIN && user.tenant_id !== currentUser.tenant_id) {
            throw Object.assign(
                new Error("Forbidden"),
                { statusCode: 403 }
            );
        }
        return user;
};

//Lấy user theo Tenant
exports.getUsersByTenant = async (user) => {
    const { page, limit } = filters;

  const offset = (page - 1) * limit;

  const rows = await userModel.getUsersByTenant(filters, offset, limit);

  const total = await userModel.countUsersByTenant(filters);

  return {
    data: rows,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };
};

exports.listUsers = async (filters) => {

  const { page, limit } = filters;

  const offset = (page - 1) * limit;

  const rows = await userModel.listUsers(filters, offset, limit);

  const total = await userModel.countUsers(filters);

  return {
    data: rows,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };
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

    await userModel.updatePassword(id, password_hash);
};


//Update User
exports.updateUserStatus = async(id, trangThai) => {
        if(!["active", "suspended"].includes(trangThai)) {
            throw Object.assign(
                new Error("Invalid status"),
                { statusCode: 400 }
            );
        }

        const existing = await userModel.getUserById(id);

        if(!existing){
            throw Object.assign(
                new Error("User not found"),
                { statusCode: 404 }
            );
        }

        await userModel.updateUserStatus(id, trangThai);
};

//Update thông tin Tenant
exports.updateUserInfo = async (id, body) => {
        const {soDienThoai, email} = body;

        const existing = await userModel.getUserById(id);

        if(!existing) {
             throw Object.assign(
                new Error("User not found"),
                { statusCode: 404 }
            );
        }

        const duplicate = await userModel.checkDuplicateForUpdate(id, email, soDienThoai);

        if(duplicate.length>0) {
            throw Object.assign(
                new Error("Email hoặc SĐT đã tồn tại"),
                { statusCode: 400 }
            );
        }

        await userModel.updateUserInfo(id,body);
};

//Soft delete
exports.deleteUser = async (id) => {
    await userModel.softDelete(id);
};