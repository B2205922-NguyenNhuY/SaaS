const router = require("express").Router();
const { verifyToken } = require("../middlewares/auth.middleware");
const { authorizeRoles } = require("../middlewares/role.middleware");
const { ROLES } = require("../constants/role");
const {
  checkTenantAccess,
} = require("../middlewares/checkTenantAccess.middleware");
const {
  checkTenantActive,
} = require("../middlewares/checkTenantActive.middlewares");
const {
  checkSubscriptionStatus,
} = require("../middlewares/checkSubscription.middlewares");
const paginate = require("../middlewares/paginate");
const zoneController = require("../controllers/zone.controller");
const {
  checkUserActive,
} = require("../middlewares/checkUserActive.middlewares");

router.post(
  "/",
  verifyToken,
  authorizeRoles(ROLES.TENANT_ADMIN),
  checkUserActive,
  checkTenantActive,
  checkTenantAccess,
  checkSubscriptionStatus,
  zoneController.create,
);

router.put(
  "/:id",
  verifyToken,
  authorizeRoles(ROLES.TENANT_ADMIN),
  checkUserActive,
  checkTenantActive,
  checkTenantAccess,
  checkSubscriptionStatus,
  zoneController.update,
);

router.patch(
  "/:id/status",
  verifyToken,
  authorizeRoles(ROLES.TENANT_ADMIN),
  checkUserActive,
  checkTenantActive,
  checkTenantAccess,
  checkSubscriptionStatus,
  zoneController.updateStatus,
);

router.get(
  "/",
  verifyToken,
  authorizeRoles(ROLES.TENANT_ADMIN, ROLES.COLLECTOR),
  checkUserActive,
  checkTenantActive,
  checkTenantAccess,
  checkSubscriptionStatus,
  paginate,
  zoneController.list,
);

router.get(
  "/:id",
  verifyToken,
  authorizeRoles(ROLES.TENANT_ADMIN, ROLES.COLLECTOR),
  checkUserActive,
  checkTenantActive,
  checkTenantAccess,
  checkSubscriptionStatus,
  zoneController.getById,
);

module.exports = router;
