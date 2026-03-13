const express = require("express");
const router = express.Router();

const controller = require("../controllers/receiptCharge.controller");

const { verifyToken } = require("../middlewares/auth.middleware");



router.get(
    "/:receipt_id",
    verifyToken,
    controller.getChargesByReceipt
);



router.get(
    "/:charge_id",
    verifyToken,
    controller.getReceiptsByCharge
);

module.exports = router;