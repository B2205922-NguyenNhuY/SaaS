const router = require("express").Router();
const { verifyToken } = require("../middlewares/auth.middleware");
const { requirePermission } = require("../middlewares/permission.middleware");
const paginate = require("../middlewares/paginate.middleware");
const { checkTenantActive } = require("../middlewares/checkTenantActive.middlewares");
const { checkSubscriptionStatus } = require("../middlewares/checkSubscription.middlewares");
const C = require("../controllers/kioskType.controller");

router.post("/", verifyToken, checkTenantActive, checkSubscriptionStatus, requirePermission("CREATE_KIOSK_TYPE"), C.create); // 27
router.put("/:id", verifyToken, checkTenantActive, checkSubscriptionStatus, requirePermission("UPDATE_KIOSK_TYPE"), C.update); // NEW
router.get("/", verifyToken, checkTenantActive, checkSubscriptionStatus, requirePermission("VIEW_KIOSK_TYPE"), paginate, C.list); // 28

module.exports = router;