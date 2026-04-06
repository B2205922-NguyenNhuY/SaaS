const express = require("express");
const router = express.Router();
const paymentController = require("../controllers/payment.controller");
const {verifyToken} = require("../middlewares/auth.middleware");
const { checkUserActive } = require("../middlewares/checkUserActive.middlewares");

router.post("/checkout", verifyToken, checkUserActive, paymentController.createCheckoutSession);
router.post('/create-momo',verifyToken, checkUserActive, paymentController.createPayment);

router.get("/history", verifyToken, checkUserActive, paymentController.getPaymentHistory);
router.get("/:payment_id", verifyToken, checkUserActive, paymentController.getPaymentDetail);

router.post('/momo-webhook', paymentController.momoWebhook);

module.exports = router;