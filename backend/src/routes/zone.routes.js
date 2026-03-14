const router = require("express").Router();
const { verifyToken } = require("../middlewares/auth.middleware");
const { requirePermission } = require("../middlewares/permission.middleware");
const paginate = require("../middlewares/paginate.middleware");
const { checkTenantActive } = require("../middlewares/checkTenantActive.middlewares");
const { checkSubscriptionStatus } = require("../middlewares/checkSubscription.middlewares");
const C = require("../controllers/zone.controller");

router.post("/", verifyToken, checkTenantActive, checkSubscriptionStatus, requirePermission("CREATE_ZONE"), C.create); // 23
router.put("/:id", verifyToken, checkTenantActive, checkSubscriptionStatus, requirePermission("UPDATE_ZONE"), C.update); // 24
router.patch("/:id/status", verifyToken, checkTenantActive, checkSubscriptionStatus, requirePermission("LOCK_ZONE"), C.updateStatus); // 25
router.get("/", verifyToken, checkTenantActive, checkSubscriptionStatus, requirePermission("VIEW_ZONE"), paginate, C.list); // 26

module.exports = router;