const express = require("express");
const router = express.Router();

const { ROLES } = require("../constants/role")
const auth = require("../middlewares/auth.middleware");
const role = require("../middlewares/role.middleware");
const userController = require("../controllers/users.controller");
const { checkSubscriptionStatus } = require("../middlewares/checkSubscription.middlewares");
const { checkTenantAccess } = require("../middlewares/checkTenantAccess.middleware");
const { checkTenantActive } = require("../middlewares/checkTenantActive.middlewares");
const { checkCreateUserPermission } = require("../middlewares/checkCreateUserPermission.middlewares");
const { checkUserActive } = require("../middlewares/checkUserActive.middlewares");

router.post("/", auth.verifyToken, role.authorizeRoles(ROLES.SUPER_ADMIN,ROLES.TENANT_ADMIN), checkUserActive, checkTenantAccess, checkTenantActive, checkSubscriptionStatus, userController.createUser);
router.get("/", auth.verifyToken, role.authorizeRoles(ROLES.SUPER_ADMIN,ROLES.TENANT_ADMIN), checkUserActive, checkTenantAccess, checkTenantActive, checkSubscriptionStatus, userController.getUsersByTenant);
router.get("/list", auth.verifyToken, role.authorizeRoles(ROLES.SUPER_ADMIN,ROLES.TENANT_ADMIN), checkUserActive, checkTenantAccess, checkTenantActive, checkSubscriptionStatus, userController.listUsers);
router.get("/:id", auth.verifyToken, role.authorizeRoles(ROLES.SUPER_ADMIN,ROLES.TENANT_ADMIN), checkUserActive, checkTenantAccess, checkTenantActive, checkSubscriptionStatus, userController.getUserById);
router.put("/:id", auth.verifyToken, role.authorizeRoles(ROLES.SUPER_ADMIN,ROLES.TENANT_ADMIN), checkUserActive, checkTenantAccess, checkTenantActive, checkSubscriptionStatus, userController.updateUserInfo);
router.patch("/:id/status", auth.verifyToken, role.authorizeRoles(ROLES.SUPER_ADMIN,ROLES.TENANT_ADMIN), checkUserActive, checkTenantAccess, checkTenantActive, checkSubscriptionStatus, userController.updateUserStatus);

module.exports = router;