const express = require("express");
const router = express.Router();
const controller = require("../controllers/shift.controller");
const { verifyToken } = require("../middlewares/auth.middleware");
const { authorizeRoles } = require("../middlewares/role.middleware");
const paginate = require("../middlewares/paginate");
const { ROLES } = require("../constants/role");
const {
  checkUserActive,
} = require("../middlewares/checkUserActive.middlewares");
const {
  checkTenantActive,
} = require("../middlewares/checkTenantActive.middlewares");
const {
  checkTenantAccess,
} = require("../middlewares/checkTenantAccess.middleware");
const {
  checkSubscriptionStatus,
} = require("../middlewares/checkSubscription.middlewares");

router.post(
  "/start",
  verifyToken,
  authorizeRoles(ROLES.COLLECTOR),
  checkUserActive,
  checkTenantActive,
  checkSubscriptionStatus,
  controller.startShift,
);
router.post(
  "/end",
  verifyToken,
  authorizeRoles(ROLES.COLLECTOR),
  checkUserActive,
  checkTenantActive,
  checkTenantAccess,
  checkSubscriptionStatus,
  controller.endShift,
);
router.put(
  "/end/:id",
  verifyToken,
  authorizeRoles(ROLES.COLLECTOR),
  checkUserActive,
  checkTenantActive,
  checkTenantAccess,
  checkSubscriptionStatus,
  controller.endShift,
);
router.get(
  "/",
  verifyToken,
  authorizeRoles(ROLES.TENANT_ADMIN, ROLES.COLLECTOR),
  checkUserActive,
  checkTenantActive,
  checkSubscriptionStatus,
  paginate,
  controller.getShifts,
);
router.get(
  "/active",
  verifyToken,
  authorizeRoles(ROLES.COLLECTOR),
  checkUserActive,
  checkTenantActive,
  checkSubscriptionStatus,
  controller.getActiveShift,
);
module.exports = router;
