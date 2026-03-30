const express = require("express");
const router = express.Router();

const controller = require("../controllers/receiptCharge.controller");

const { verifyToken } = require("../middlewares/auth.middleware");
const { checkUserActive } = require("../middlewares/checkUserActive.middlewares");
const { checkTenantActive } = require("../middlewares/checkTenantActive.middlewares");
const { checkTenantAccess } = require("../middlewares/checkTenantAccess.middleware");
const { checkSubscriptionStatus } = require("../middlewares/checkSubscription.middlewares");

router.get("/receipt/:receipt_id", verifyToken, checkUserActive, checkTenantActive, checkSubscriptionStatus, controller.getChargesByReceipt);

router.get("/charge/:charge_id", verifyToken, checkUserActive, checkTenantActive, checkSubscriptionStatus, controller.getReceiptsByCharge);

module.exports = router;
