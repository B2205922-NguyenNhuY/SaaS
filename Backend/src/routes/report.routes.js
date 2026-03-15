const express = require("express");
const router = express.Router();
const controller = require("../controllers/report.controller");
const { verifyToken } = require("../middlewares/auth.middleware");
const { authorizeRoles } = require("../middlewares/role.middleware");
const { ROLES } = require("../constants/role");
const { checkUserActive } = require("../middlewares/checkUserActive.middlewares");
const { checkTenantActive } = require("../middlewares/checkTenantActive.middlewares");
const { checkSubscriptionStatus } = require("../middlewares/checkSubscription.middlewares");
router.get(
  "/",
  verifyToken,
  authorizeRoles(ROLES.TENANT_ADMIN),
  checkUserActive, checkTenantActive, checkSubscriptionStatus,
  controller.getReport,
);
router.get(
  "/export",
  verifyToken,
  authorizeRoles(ROLES.TENANT_ADMIN),
  checkUserActive, checkTenantActive, checkSubscriptionStatus,
  controller.exportRevenueExcel,
);
router.get(
  "/total_revenue",
  verifyToken,
  authorizeRoles(ROLES.TENANT_ADMIN),
  checkUserActive, checkTenantActive, checkSubscriptionStatus,
  controller.getTotalRevenue,
);
router.get(
  "/zone",
  verifyToken,
  authorizeRoles(ROLES.TENANT_ADMIN),
  checkUserActive, checkTenantActive, checkSubscriptionStatus,
  controller.getRevenueByZone,
);
router.get(
  "/collector",
  verifyToken,
  authorizeRoles(ROLES.TENANT_ADMIN),
  checkUserActive, checkTenantActive, checkSubscriptionStatus,
  controller.getRevenueByCollector,
);
router.get(
  "/export_excel",
  verifyToken,
  authorizeRoles(ROLES.TENANT_ADMIN),
  checkUserActive, checkTenantActive, checkSubscriptionStatus,
  controller.exportRevenueExcel,
);
module.exports = router;
