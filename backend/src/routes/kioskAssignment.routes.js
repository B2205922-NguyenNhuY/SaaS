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
const C = require("../controllers/kioskAssignment.controller");

router.post(
  "/",
  verifyToken,
  checkTenantActive,
  checkSubscriptionStatus,
  requirePermission("ASSIGN_KIOSK"),
  C.assign,
); // POST create active
router.get("/:id/end", verifyToken, C.end);
router.get(
  "/",
  verifyToken,
  checkTenantActive,
  checkSubscriptionStatus,
  requirePermission("ASSIGN_KIOSK"),
  paginate,
  C.list,
); // list

module.exports = router;