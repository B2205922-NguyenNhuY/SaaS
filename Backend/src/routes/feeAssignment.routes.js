const express = require("express");
const router = express.Router();
const controller = require("../controllers/feeAssignment.controller");
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
  controller.createAssignment,
);
router.get("/", verifyToken, checkUserActive, checkTenantActive, checkSubscriptionStatus, paginate, controller.listAssignments);
router.get("/target", verifyToken, checkUserActive, checkTenantActive, checkSubscriptionStatus, controller.getAssignmentsByTarget);
router.get(
  "/fee/:fee_id",
  verifyToken,
  checkUserActive, checkTenantActive, checkTenantAccess, checkSubscriptionStatus,
  paginate,
  controller.getAssignmentsByFee,
);
router.get("/:id", verifyToken, checkUserActive, checkTenantActive, checkTenantAccess, checkSubscriptionStatus, controller.getAssignmentById);
router.put(
  "/:id",
  verifyToken,
  authorizeRoles(ROLES.TENANT_ADMIN),
  checkUserActive, checkTenantActive, checkTenantAccess, checkSubscriptionStatus,
  controller.updateAssignment,
);
router.patch(
  "/:id/deactivate",
  verifyToken,
  authorizeRoles(ROLES.TENANT_ADMIN),
  checkUserActive, checkTenantActive, checkTenantAccess, checkSubscriptionStatus,
  controller.deactivateAssignment,
);
module.exports = router;
