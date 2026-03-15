const router = require("express").Router();
const { verifyToken } = require("../middlewares/auth.middleware");
const { authorizeRoles } = require("../middlewares/role.middleware");
const { ROLES } = require("../constants/role");
const paginate = require("../middlewares/paginate");
const kioskAssignmentController = require("../controllers/kioskAssignment.controller");
const { checkUserActive } = require("../middlewares/checkUserActive.middlewares");
const { checkTenantActive } = require("../middlewares/checkTenantActive.middlewares");
const { checkTenantAccess } = require("../middlewares/checkTenantAccess.middleware");
const { checkSubscriptionStatus } = require("../middlewares/checkSubscription.middlewares");

router.post("/", verifyToken, authorizeRoles(ROLES.TENANT_ADMIN), checkUserActive, checkTenantActive, checkTenantAccess, checkSubscriptionStatus,kioskAssignmentController.assign);

router.get(
  "/",
  verifyToken,
  authorizeRoles(ROLES.TENANT_ADMIN), checkUserActive, checkTenantActive, checkSubscriptionStatus,
  paginate,
  kioskAssignmentController.list,
);

router.get("/:id", verifyToken, authorizeRoles(ROLES.TENANT_ADMIN), checkUserActive, checkTenantActive, checkTenantAccess, checkSubscriptionStatus, kioskAssignmentController.getById);

router.post(
  "/:id/ended",
  verifyToken,
  authorizeRoles(ROLES.TENANT_ADMIN), checkUserActive, checkTenantActive, checkTenantAccess, checkSubscriptionStatus,
  kioskAssignmentController.endAssignment,
);

module.exports = router;