const express = require("express");
const router = express.Router();
const controller = require("../controllers/debt.controller");
const { verifyToken } = require("../middlewares/auth.middleware");
const { authorizeRoles } = require("../middlewares/role.middleware");
const paginate = require("../middlewares/paginate");
const { ROLES } = require("../constants/role");
const { checkUserActive } = require("../middlewares/checkUserActive.middlewares");
const { checkTenantActive } = require("../middlewares/checkTenantActive.middlewares");
const { checkTenantAccess } = require("../middlewares/checkTenantAccess.middleware");
const { checkSubscriptionStatus } = require("../middlewares/checkSubscription.middlewares");
router.get(
  "/",
  verifyToken,
  authorizeRoles(ROLES.TENANT_ADMIN),
  checkUserActive, checkTenantActive, checkSubscriptionStatus,
  paginate,
  controller.getDebts,
);
router.get(
  "/merchant/:merchant_id",
  verifyToken,
  authorizeRoles(ROLES.TENANT_ADMIN),
  checkUserActive, checkTenantActive, checkTenantAccess, checkSubscriptionStatus,
  controller.getDebtsByMerchant,
);
router.get(
  "/total",
  verifyToken,
  authorizeRoles(ROLES.TENANT_ADMIN),
  checkUserActive, checkTenantActive, checkSubscriptionStatus,
  controller.getTotalDebt,
);
router.get(
  "/top",
  verifyToken,
  authorizeRoles(ROLES.TENANT_ADMIN),
  checkUserActive, checkTenantActive, checkSubscriptionStatus,
  controller.getTopDebtors,
);
module.exports = router;
