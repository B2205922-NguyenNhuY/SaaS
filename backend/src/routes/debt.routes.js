const express = require("express");
const router = express.Router();

const controller = require("../controllers/debt.controller");

const { verifyToken } = require("../middlewares/auth.middleware");
const { authorizeRoles } = require("../middlewares/role.middleware");

const { ROLES } = require("../constants/role");



router.get(
    "/",
    verifyToken,
    authorizeRoles(ROLES.TENANT_ADMIN),
    controller.getDebts
);



router.get(
    "/merchant/:merchant_id",
    verifyToken,
    authorizeRoles(ROLES.TENANT_ADMIN),
    controller.getDebtsByMerchant
);



router.get(
    "/total",
    verifyToken,
    authorizeRoles(ROLES.TENANT_ADMIN),
    controller.getTotalDebt
);



router.get(
    "/top",
    verifyToken,
    authorizeRoles(ROLES.TENANT_ADMIN),
    controller.getTopDebtors
);

module.exports = router;