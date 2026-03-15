const express = require("express");
const router = express.Router();
const controller = require("../controllers/collectionperiod.controller");
const { ROLES } = require("../constants/role");
const { verifyToken } = require("../middlewares/auth.middleware");
const { authorizeRoles } = require("../middlewares/role.middleware");
const paginate = require("../middlewares/paginate");
const { checkUserActive } = require("../middlewares/checkUserActive.middlewares");
const { checkTenantActive } = require("../middlewares/checkTenantActive.middlewares");
const { checkTenantAccess } = require("../middlewares/checkTenantAccess.middleware");
const { checkSubscriptionStatus } = require("../middlewares/checkSubscription.middlewares");
router.post(
  "/",
  verifyToken,
  authorizeRoles(ROLES.TENANT_ADMIN),
  checkUserActive, checkTenantActive, checkTenantAccess, checkSubscriptionStatus,
  controller.createPeriod,
);
router.get("/", verifyToken, checkUserActive, checkTenantActive, checkSubscriptionStatus, paginate, controller.getPeriods);
router.post(
  "/:period_id/generate_chages",
  verifyToken,
  authorizeRoles(ROLES.TENANT_ADMIN),
  checkUserActive, checkTenantActive, checkTenantAccess, checkSubscriptionStatus,
  controller.generateCharges,
);
router.get("/:id", verifyToken, checkUserActive, checkTenantActive, checkTenantAccess, checkSubscriptionStatus, controller.getPeriodDetail);
router.put(
  "/:id",
  verifyToken,
  authorizeRoles(ROLES.TENANT_ADMIN),
  checkUserActive, checkTenantActive, checkTenantAccess, checkSubscriptionStatus,
  controller.updatePeriod,
);
router.delete(
  "/:id",
  verifyToken,
  authorizeRoles(ROLES.TENANT_ADMIN),
  checkUserActive, checkTenantActive, checkTenantAccess, checkSubscriptionStatus,
  controller.deletePeriod,
);
module.exports = router;
