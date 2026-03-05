const express = require("express");
const router = express.Router();

const controller = require("../controllers/receiptCharge.controller");

const { verifyToken } = require("../middlewares/auth.middleware");
const { authorizeRoles } = require("../middlewares/role.middleware");

const ROLES = require("../constants/role");



router.post(
    "/",
    verifyToken,
    authorizeRoles(ROLES.COLLECTOR, ROLES.TENANT_ADMIN),
    controller.createReceiptCharge
);



router.get(
    "/receipt/:receipt_id",
    verifyToken,
    controller.getChargesByReceipt
);



router.get(
    "/charge/:charge_id",
    verifyToken,
    controller.getReceiptsByCharge
);

module.exports = router;