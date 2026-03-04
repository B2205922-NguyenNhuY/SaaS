const userModel = require("../models/users.model");
const roleModel = require("../models/role.model");
const planSubscriptionModel = require("../models/plan_subscription.model");
const bcrypt = require("bcrypt");
const { ROLE_CREATE_PERMISSION, ROLES } = require("../constants/role");

const SALT_ROUNDS = 10;
//Tạo user mới
exports.createUser = async (req, res) => {
  try {
    const creatorRole = req.user.role;
    const creatorTenantId = req.user.tenant_id;

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
      tenant_id,
      trangThai,
    } = req.body;

    if (!email || !password || !hoTen || !soDienThoai) {
      return res.status(400).json({
        message: "Missing required fields",
      });
    }

    let finalTenantId;

    if (creatorRole === ROLES.SUPER_ADMIN) {
      if (!tenant_id) {
        return res.status(400).json({
          message: "tenant_id is required",
        });
      }
      finalTenantId = tenant_id;
    } else {
      // Tenant admin bị ép tenant
      finalTenantId = creatorTenantId;
    }

    const tenant = await tenantModel.getById(finalTenantId);

    if (!tenant) {
      return res.status(404).json({
        message: "Tenant không tồn tại",
      });
    }

    let duplicate;

    if (roleToCreate.tenVaiTro === "tenant_admin") {
      duplicate = await userModel.checkDuplicateAdmin(email, soDienThoai);
    } else {
      duplicate = await userModel.checkDuplicate(
        email,
        soDienThoai,
        finalTenantId
      );
    }

    if (duplicate.length > 0) {
      return res.status(400).json({
        message: "Email hoặc Số điện thoại đã tồn tại",
      });
    }

    if (creatorRole !== ROLES.SUPER_ADMIN) {
      const totalAccounts = await userModel.countAccountsByTenant(finalTenantId);

      const plan = await planSubscriptionModel.getPlanByTenantSubscribed(finalTenantId);

      if (!plan) {
        return res.status(403).json({
          message: "Subscription không hợp lệ hoặc đã hết hạn",
        });
      }

      if (totalAccounts >= plan.gioiHanUser) {
        return res.status(400).json({
          message: "Đã vượt quá số lượng user cho phép của gói",
        });
      }
    }

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

    res.status(201).json({
      message: "User created successfully",
      user_id: result.insertId,
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

//Lấy tất cả User
exports.getAllUsers = async (req, res) => {
    try {
        const [rows] = await userModel.getAllUsers();

        res.json(rows);

    } catch (error) {
        res.status(500).json({error: error.message});
    }
};

//Lấy User theo ID
exports.getUserById = async (req, res) => {
    try{
        const { id } = req.params;

        const user = await userModel.getUserById(id);

        if(!user) {
            return res.status(404).json({message: "User not found"});
        }

        if(req.user.role !== "super_admin") {
            if(user.tenant_id !== req.user.tenant_id) {
                return res.status(403).json({
                    message: "Forbidden",
                });
            }
        }
        res.json(user);
        
    } catch (error) {
        res.status(500).json({error: error.message});
    }
};

//Lấy user theo Tenant
exports.getUsersByTenant = async (req, res) => {
  try {
    const tenant_id = req.user.tenant_id; 

    const users = await userModel.getUsersByTenant(tenant_id);

    res.json(users);

  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
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

    await userModel.updatePassword(id, password_hash);

    res.json({
      message: "Password updated successfully",
    });

  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
};


//Update User
exports.updateUserStatus = async(req, res) => {
    try{
        const { id } = req.params;
        const { trangThai } = req.body;

        if(!["active", "suspended"].includes(trangThai)) {
            return res.status(400).json({
                message: "Invalid status"
            });
        }

        const existing = await userModel.getUserById(id);

        if(!existing){
            return res.status(400).json({message: "User not found"});
        }

        await userModel.updateUserStatus(id, trangThai);

        res.json({message: "User status updated susscessfully"});
    } catch (error) {
        res.status(500).json({error: error.message});
    }
};

//Update thông tin Tenant
exports.updateUserInfo = async (req, res) => {
    try {
        const { id } = req.params;
        const {hoTen, soDienThoai, email} = req.body;

        const existing = await userModel.getUserById(id);

        if(!existing) {
            return res.status(404).json({message: "User not found"});
        }

        const duplicate = await userModel.checkDuplicateForUpdate(id, email, soDienThoai);

        if(duplicate.length>0) {
            return res.status(400).json({
                message: "Email hoặc Số điện thoại đã tồn tại"
            });
        }

        await userModel.updateUserInfo(id, req.body);

        res.json({message: "User updated successfully"});
    } catch (error) {
        res.status(500).json({error: error.message});
    }
};

//Soft delete
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    await userModel.softDelete(id);

    res.json({
      message: "User deleted successfully",
    });

  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
};