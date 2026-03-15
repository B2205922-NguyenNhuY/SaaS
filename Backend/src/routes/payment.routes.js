const express = require("express");
const router = express.Router();
const paymentController = require("../controllers/payment.controller");
const {verifyToken} = require("../middlewares/auth.middleware");
const { checkUserActive } = require("../middlewares/checkUserActive.middlewares");

router.post("/checkout", verifyToken, checkUserActive, paymentController.createCheckoutSession);

module.exports = router;