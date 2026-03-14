const router = require("express").Router();
const { verifyToken } = require("../middlewares/auth.middleware");
const { requirePermission } = require("../middlewares/permission.middleware");
const paginate = require("../middlewares/paginate.middleware");
const {
  checkTenantActive,
} = require("../middlewares/checkTenantActive.middlewares");
const {
  checkSubscriptionStatus,
} = require("../middlewares/checkSubscription.middlewares");
const C = require("../controllers/market.controller");
const { authorizeRoles } = require("../middlewares/role.middleware");
const { ROLES } = require("../constants/role");

router.post(
  "/",
  verifyToken,
  authorizeRoles(ROLES.TENANT_ADMIN),
  checkTenantActive,
  checkSubscriptionStatus,
  requirePermission("CREATE_MARKET"),
  C.create,
); // 19
router.put(
  "/:id",
  verifyToken,
  checkTenantActive,
  checkSubscriptionStatus,
  requirePermission("UPDATE_MARKET"),
  C.update,
); // 20
router.patch(
  "/:id/status",
  verifyToken,
  checkTenantActive,
  checkSubscriptionStatus,
  requirePermission("LOCK_MARKET"),
  C.updateStatus,
); // 21
router.get(
  "/",
  verifyToken,
  checkTenantActive,
  checkSubscriptionStatus,
  requirePermission("VIEW_MARKET"),
  paginate,
  C.list,
); // 22

module.exports = router;