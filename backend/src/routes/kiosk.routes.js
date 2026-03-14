const router = require("express").Router();
const { verifyToken } = require("../middlewares/auth.middleware");
const { requirePermission } = require("../middlewares/permission.middleware");
const paginate = require("../middlewares/paginate.middleware");
const { checkTenantActive } = require("../middlewares/checkTenantActive.middlewares");
const { checkSubscriptionStatus } = require("../middlewares/checkSubscription.middlewares");
const C = require("../controllers/kiosk.controller");

router.post("/", verifyToken, checkTenantActive, checkSubscriptionStatus, requirePermission("CREATE_KIOSK"), C.create); // 29
router.put("/:id", verifyToken, checkTenantActive, checkSubscriptionStatus, requirePermission("UPDATE_KIOSK"), C.update); // 30
router.patch("/:id/status", verifyToken, checkTenantActive, checkSubscriptionStatus, requirePermission("LOCK_KIOSK"), C.updateStatus); // 31
router.get("/", verifyToken, checkTenantActive, checkSubscriptionStatus, requirePermission("VIEW_KIOSK"), paginate, C.list); // 32
router.get("/:id", verifyToken, checkTenantActive, checkSubscriptionStatus, requirePermission("VIEW_KIOSK"), C.getById); // NEW

module.exports = router;