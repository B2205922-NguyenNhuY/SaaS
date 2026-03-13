const express = require("express");
const router = express.Router();

const controller = require("../controllers/report.controller");

const { verifyToken } = require("../middlewares/auth.middleware");
const { authorizeRoles } = require("../middlewares/role.middleware");

const { ROLES } = require("../constants/role");



router.get(
    "/total-revenue",
    verifyToken,
    authorizeRoles(ROLES.TENANT_ADMIN),
    controller.getTotalRevenue
);



router.get(
    "/zone",
    verifyToken,
    authorizeRoles(ROLES.TENANT_ADMIN),
    controller.getRevenueByZone
);



router.get(
    "/collector",
    verifyToken,
    authorizeRoles(ROLES.TENANT_ADMIN),
    controller.getRevenueByCollector
);



router.get(
    "/export-excel",
    verifyToken,
    authorizeRoles(ROLES.TENANT_ADMIN),
    controller.exportRevenueExcel
);

module.exports = router;