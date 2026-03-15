const express = require("express");
const router = express.Router();
const paymentController = require("../controllers/payment.controller");
const { verifyToken } = require("../middlewares/auth.middleware");
router.post("/", verifyToken, paymentController.createCheckoutSession);
router.post("/checkout", verifyToken, paymentController.createCheckoutSession);
module.exports = router;
