const express = require("express");
const router = express.Router();
const { ROLES } = require("../constants/role");
const auth = require("../middlewares/auth.middleware");
const role = require("../middlewares/role.middleware");
const userModel = require("../models/users.model");
const userController = require("../controllers/users.controller");
const { checkSubscriptionStatus } = require("../middlewares/checkSubscription.middlewares");
const { checkTenantAccess } = require("../middlewares/checkTenantAccess.middleware");
const { checkTenantActive } = require("../middlewares/checkTenantActive.middlewares");
const { checkUserActive } = require("../middlewares/checkUserActive.middlewares");


router.get(
  "/account-count",
  auth.verifyToken,
  role.authorizeRoles(ROLES.TENANT_ADMIN),
  checkUserActive,
  checkTenantActive,
  checkSubscriptionStatus,
  async (req, res, next) => {
    try {
      const total = await userModel.countAccountsByTenant(req.user.tenant_id);
      res.json({ total });
    } catch (e) { next(e); }
  }
);

router.get(
  "/list",
  auth.verifyToken,
  role.authorizeRoles(ROLES.SUPER_ADMIN, ROLES.TENANT_ADMIN),
  checkUserActive,
  checkTenantAccess,
  checkTenantActive,
  checkSubscriptionStatus,
  userController.listUsers
);


router.post(
  "/",
  auth.verifyToken,
  role.authorizeRoles(ROLES.SUPER_ADMIN, ROLES.TENANT_ADMIN),
  checkUserActive,
  checkTenantAccess,
  checkTenantActive,
  checkSubscriptionStatus,
  userController.createUser
);

router.get(
  "/",
  auth.verifyToken,
  role.authorizeRoles(ROLES.SUPER_ADMIN, ROLES.TENANT_ADMIN),
  checkUserActive,
  checkTenantAccess,
  checkTenantActive,
  checkSubscriptionStatus,
  userController.getUsersByTenant
);

router.get(
  "/:id",
  auth.verifyToken,
  role.authorizeRoles(ROLES.SUPER_ADMIN, ROLES.TENANT_ADMIN),
  checkUserActive,
  checkTenantAccess,
  checkTenantActive,
  checkSubscriptionStatus,
  userController.getUserById
);

router.put(
  "/:id",
  auth.verifyToken,
  role.authorizeRoles(ROLES.SUPER_ADMIN, ROLES.TENANT_ADMIN),
  checkUserActive,
  checkTenantAccess,
  checkTenantActive,
  checkSubscriptionStatus,
  userController.updateUserInfo
);

router.patch(
  "/:id/status",
  auth.verifyToken,
  role.authorizeRoles(ROLES.SUPER_ADMIN, ROLES.TENANT_ADMIN),
  checkUserActive,
  checkTenantAccess,
  checkTenantActive,
  checkSubscriptionStatus,
  userController.updateUserStatus
);

router.put(
  "/:id/password",
  auth.verifyToken,
  role.authorizeRoles(ROLES.TENANT_ADMIN, ROLES.MERCHANT, ROLES.COLLECTOR),
  checkUserActive,
  userController.changePassword
);

module.exports = router;