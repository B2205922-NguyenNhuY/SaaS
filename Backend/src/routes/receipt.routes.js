const express = require("express");
const router = express.Router();
const controller = require("../controllers/receipt.controller");
const { verifyToken } = require("../middlewares/auth.middleware");
const { authorizeRoles } = require("../middlewares/role.middleware");
const paginate = require("../middlewares/paginate");
const { ROLES } = require("../constants/role");
const { checkUserActive } = require("../middlewares/checkUserActive.middlewares");
const { checkTenantActive } = require("../middlewares/checkTenantActive.middlewares");
const { checkTenantAccess } = require("../middlewares/checkTenantAccess.middleware");
const { checkSubscriptionStatus } = require("../middlewares/checkSubscription.middlewares");
router.post(
  "/",
  verifyToken,
  authorizeRoles(ROLES.COLLECTOR, ROLES.TENANT_ADMIN),
  checkUserActive, checkTenantActive, checkTenantAccess, checkSubscriptionStatus,
  controller.createReceipt,
);
router.get("/", verifyToken, checkUserActive, checkTenantActive, checkSubscriptionStatus, paginate, controller.getReceipts);
router.get("/:id", verifyToken, checkUserActive, checkTenantActive, checkTenantAccess, checkSubscriptionStatus, controller.getReceiptDetail);
module.exports = router;
