const express = require("express");
const router = express.Router();

const { ROLES } = require("../constants/role")
const auth = require("../middlewares/auth.middleware");
const role = require("../middlewares/role.middleware");
const superAdminController = require("../controllers/super_admin.controller");
const { checkCreateUserPermission } = require("../middlewares/checkCreateUserPermission.middlewares");
const { checkUserActive } = require("../middlewares/checkUserActive.middlewares");

router.post("/", auth.verifyToken, role.authorizeRoles(ROLES.SUPER_ADMIN), checkUserActive, superAdminController.createSuperAdmin);
router.get("/", auth.verifyToken, role.authorizeRoles(ROLES.SUPER_ADMIN), checkUserActive, superAdminController.getAllSuperAdmins);
router.get("/list", auth.verifyToken, role.authorizeRoles(ROLES.SUPER_ADMIN), checkUserActive, superAdminController.listSuperAdmins);
router.get("/:id", auth.verifyToken, role.authorizeRoles(ROLES.SUPER_ADMIN), checkUserActive, superAdminController.getSuperAdminById);
router.put("/:id", auth.verifyToken, role.authorizeRoles(ROLES.SUPER_ADMIN), checkUserActive, superAdminController.updateSuperAdminInfo);
router.patch("/:id/status", auth.verifyToken, role.authorizeRoles(ROLES.SUPER_ADMIN), checkUserActive, superAdminController.updateSuperAdminStatus);

module.exports = router;