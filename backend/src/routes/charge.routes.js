const express = require("express");
const router = express.Router();
const chargeController = require("../controllers/charge.controller");
const { ROLES } = require("../constants/role");
const { verifyToken } = require("../middlewares/auth.middleware");
const { authorizeRoles } = require("../middlewares/role.middleware");
const paginate = require("../middlewares/paginate");
router.post(
  "/",
  verifyToken,
  authorizeRoles(ROLES.TENANT_ADMIN),
  chargeController.createCharge,
);
router.get("/", verifyToken, paginate, chargeController.listCharges);
router.get(
  "/period/:period_id",
  verifyToken,
  chargeController.getChargesByPeriod,
);
router.get(
  "/merchant/:merchant_id",
  verifyToken,
  chargeController.getChargesByMerchant,
);
router.post(
  "/:id/receipts",
  verifyToken,
  authorizeRoles(ROLES.COLLECTOR, ROLES.TENANT_ADMIN),
  chargeController.createReceiptForCharge,
);
router.patch(
  "/:id/status",
  verifyToken,
  authorizeRoles(ROLES.TENANT_ADMIN),
  chargeController.updateChargeStatus,
);
router.patch(
  "/:id/debt_status",
  verifyToken,
  authorizeRoles(ROLES.TENANT_ADMIN),
  chargeController.updateDebtStatus,
);
router.get(
  "/:id/history",
  verifyToken,
  authorizeRoles(ROLES.TENANT_ADMIN),
  chargeController.getChargeHistory,
);
module.exports = router;
