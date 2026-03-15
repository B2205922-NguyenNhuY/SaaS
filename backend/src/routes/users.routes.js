const express = require("express");
const router = express.Router();
const { ROLES } = require("../constants/role");
const auth = require("../middlewares/auth.middleware");
const role = require("../middlewares/role.middleware");
const paginate = require("../middlewares/paginate");
const userController = require("../controllers/users.controller");
const {
  checkSubscriptionStatus,
} = require("../middlewares/checkSubscription.middlewares");
const {
  checkTenantAccess,
} = require("../middlewares/checkTenantAccess.middleware");
const {
  checkTenantActive,
} = require("../middlewares/checkTenantActive.middlewares");

router.post(
  "/",
  auth.verifyToken,
  role.authorizeRoles(ROLES.SUPER_ADMIN, ROLES.TENANT_ADMIN),
  checkTenantAccess,
  checkTenantActive,
  checkSubscriptionStatus,
  userController.createUser,
);
router.get(
  "/",
  auth.verifyToken,
  role.authorizeRoles(ROLES.SUPER_ADMIN, ROLES.TENANT_ADMIN),
  checkTenantActive,
  checkSubscriptionStatus,
  paginate,
  userController.getUsersByTenant,
);
router.get(
  "/:id",
  auth.verifyToken,
  role.authorizeRoles(ROLES.SUPER_ADMIN, ROLES.TENANT_ADMIN),
  checkTenantActive,
  checkSubscriptionStatus,
  userController.getUserById,
);
router.put(
  "/:id",
  auth.verifyToken,
  role.authorizeRoles(ROLES.SUPER_ADMIN, ROLES.TENANT_ADMIN),
  checkTenantActive,
  checkSubscriptionStatus,
  userController.updateUserInfo,
);
router.patch(
  "/change_password",
  auth.verifyToken,
  userController.changePassword,
);
router.patch(
  "/:id/status",
  auth.verifyToken,
  role.authorizeRoles(ROLES.SUPER_ADMIN, ROLES.TENANT_ADMIN),
  checkTenantActive,
  checkSubscriptionStatus,
  userController.updateUserStatus,
);
module.exports = router;
