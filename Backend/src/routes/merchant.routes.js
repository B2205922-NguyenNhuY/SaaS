const router = require("express").Router();
const { verifyToken }    = require("../middlewares/auth.middleware");
const { authorizeRoles } = require("../middlewares/role.middleware");
const { ROLES } = require("../constants/role");
const paginate = require("../middlewares/paginate");
const C = require("../controllers/merchant.controller");
const { checkUserActive } = require("../middlewares/checkUserActive.middlewares");
const { checkTenantActive } = require("../middlewares/checkTenantActive.middlewares");
const { checkSubscriptionStatus } = require("../middlewares/checkSubscription.middlewares");

router.post("/", verifyToken, authorizeRoles(ROLES.TENANT_ADMIN), C.create);
router.get(
  "/me",
  verifyToken,
  authorizeRoles(ROLES.MERCHANT),
  C.getMyProfile,
);
router.put(
  "/update",
  verifyToken,
  authorizeRoles(ROLES.MERCHANT),
  checkUserActive, checkTenantActive, checkSubscriptionStatus,
  C.updateMyProfile,
);
router.get("/", verifyToken, authorizeRoles(ROLES.TENANT_ADMIN), paginate, C.list);
router.post("/", verifyToken, (req, res, next) => { next() }, authorizeRoles(ROLES.TENANT_ADMIN), C.create);
router.get("/:id", verifyToken, authorizeRoles(ROLES.TENANT_ADMIN, ROLES.COLLECTOR), C.detail);
router.put("/:id", verifyToken, authorizeRoles(ROLES.TENANT_ADMIN), C.update);
router.patch("/:id/status", verifyToken, authorizeRoles(ROLES.TENANT_ADMIN), C.updateStatus);
router.patch("/:id/password", verifyToken, authorizeRoles(ROLES.TENANT_ADMIN, ROLES.MERCHANT), C.updatePassword);

module.exports = router;