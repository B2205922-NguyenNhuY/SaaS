const { ROLE_CREATE_PERMISSION } = require("../constants/role");
const roleModel = require("../models/role.model");

const checkCreateUserPermission = async (req, res, next) => {
  const creatorRole = req.user.role;
  const roleIDToCreate = req.body.role_id;

  const roleToCreate = await roleModel.getRoleById(roleIDToCreate);

  const allowedRoles = ROLE_CREATE_PERMISSION[creatorRole] || [];


  if (!allowedRoles.includes(roleToCreate.tenVaiTro)) {
    return res.status(403).json({
      message: `Role ${creatorRole} không được phép tạo ${roleToCreate.tenVaiTro}`,
    });
  }

  next();
};

module.exports = { checkCreateUserPermission };