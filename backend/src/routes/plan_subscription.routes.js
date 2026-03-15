const express = require("express");
const router = express.Router();
const C = require("../controllers/plan_subscription.controller");
const { verifyToken } = require("../middlewares/auth.middleware");
const { authorizeRoles } = require("../middlewares/role.middleware");
const paginate = require("../middlewares/paginate");
const { ROLES } = require("../constants/role");
router.post(
  "/",
  verifyToken,
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.TENANT_ADMIN),
  C.createSubscription,
);
router.post(
  "/upgrade",
  verifyToken,
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.TENANT_ADMIN),
  C.upgradeSubscription,
);
router.get(
  "/",
  verifyToken,
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.TENANT_ADMIN),
  paginate,
  C.listSubscriptions,
);
router.get(
  "/status",
  verifyToken,
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.TENANT_ADMIN),
  C.getSubscriptionById,
);
router.get(
  "/:id",
  verifyToken,
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.TENANT_ADMIN),
  C.getSubscriptionById,
);
module.exports = router;
