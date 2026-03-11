const express = require("express");
const router = express.Router();

const controller = require("../controllers/receipt.controller");

const { verifyToken } = require("../middlewares/auth.middleware");
const { authorizeRoles } = require("../middlewares/role.middleware");

const ROLES = require("../constants/role");


router.post(
    "/",
    verifyToken,
    authorizeRoles(ROLES.COLLECTOR, ROLES.TENANT_ADMIN),
    controller.createReceipt
);


router.get(
    "/",
    verifyToken,
    controller.getReceipts
);


router.get(
    "/:id",
    verifyToken,
    controller.getReceiptDetail
);


module.exports = router;