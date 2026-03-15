const express = require("express");
const router = express.Router();
const controller = require("../controllers/report.controller");
const { verifyToken } = require("../middlewares/auth.middleware");
const { authorizeRoles } = require("../middlewares/role.middleware");
const { ROLES } = require("../constants/role");
router.get(
  "/",
  verifyToken,
  authorizeRoles(ROLES.TENANT_ADMIN),
  controller.getReport,
);
router.get(
  "/export",
  verifyToken,
  authorizeRoles(ROLES.TENANT_ADMIN),
  controller.exportRevenueExcel,
);
router.get(
  "/total_revenue",
  verifyToken,
  authorizeRoles(ROLES.TENANT_ADMIN),
  controller.getTotalRevenue,
);
router.get(
  "/zone",
  verifyToken,
  authorizeRoles(ROLES.TENANT_ADMIN),
  controller.getRevenueByZone,
);
router.get(
  "/collector",
  verifyToken,
  authorizeRoles(ROLES.TENANT_ADMIN),
  controller.getRevenueByCollector,
);
router.get(
  "/export_excel",
  verifyToken,
  authorizeRoles(ROLES.TENANT_ADMIN),
  controller.exportRevenueExcel,
);
module.exports = router;
