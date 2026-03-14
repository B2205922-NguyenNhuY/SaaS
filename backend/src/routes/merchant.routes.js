const router = require("express").Router();
const { verifyToken } = require("../middlewares/auth.middleware");
const { requirePermission } = require("../middlewares/permission.middleware");
const paginate = require("../middlewares/paginate.middleware");
const { checkTenantActive } = require("../middlewares/checkTenantActive.middlewares");
const { checkSubscriptionStatus } = require("../middlewares/checkSubscription.middlewares");
const C = require("../controllers/merchant.controller");

router.post("/", verifyToken, checkTenantActive, checkSubscriptionStatus, requirePermission("CREATE_MERCHANT"), C.create); // 33
router.put("/:id", verifyToken, checkTenantActive, checkSubscriptionStatus, requirePermission("UPDATE_MERCHANT"), C.update); // 34
router.get("/", verifyToken, checkTenantActive, checkSubscriptionStatus, requirePermission("VIEW_MERCHANT"), paginate, C.list); // 35
router.get("/:id", verifyToken, checkTenantActive, checkSubscriptionStatus, requirePermission("VIEW_MERCHANT"), C.detail); // 55

module.exports = router;