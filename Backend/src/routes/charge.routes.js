const express = require("express");
const router = express.Router();
const chargeController = require("../controllers/charge.controller");
const { ROLES } = require("../constants/role");
const { verifyToken } = require("../middlewares/auth.middleware");
const { authorizeRoles } = require("../middlewares/role.middleware");
const uploadReceiptImage = require("../middlewares/uploadReceiptImage.middleware");
const paginate = require("../middlewares/paginate");

const {
  checkUserActive,
} = require("../middlewares/checkUserActive.middlewares");
const {
  checkTenantActive,
} = require("../middlewares/checkTenantActive.middlewares");
const {
  checkTenantAccess,
} = require("../middlewares/checkTenantAccess.middleware");
const {
  checkSubscriptionStatus,
} = require("../middlewares/checkSubscription.middlewares");

router.post(
  "/",
  verifyToken,
  authorizeRoles(ROLES.TENANT_ADMIN),
  checkUserActive,
  checkTenantActive,
  checkTenantAccess,
  checkSubscriptionStatus,
  chargeController.createCharge,
);
router.post('/generate',verifyToken, authorizeRoles(ROLES.TENANT_ADMIN), checkUserActive, checkTenantActive, checkTenantAccess, checkSubscriptionStatus, chargeController.generateCharges);

router.get(
  "/",
  verifyToken,
  authorizeRoles(ROLES.TENANT_ADMIN, ROLES.COLLECTOR),
  paginate,
  checkUserActive,
  checkTenantActive,
  checkSubscriptionStatus,
  chargeController.listCharges,
);

router.get(
  "/me",
  verifyToken, paginate,
  authorizeRoles(ROLES.MERCHANT),
  checkUserActive, checkTenantActive, checkSubscriptionStatus,
  chargeController.getMyCharges,
);
router.get(
  "/period/:period_id",
  verifyToken,
  checkUserActive,
  checkTenantActive,
  checkTenantAccess,
  checkSubscriptionStatus,
  chargeController.getChargesByPeriod,
);

router.get(
  "/merchant/:merchant_id",
  verifyToken,
  checkUserActive,
  checkTenantActive,
  checkTenantAccess,
  checkSubscriptionStatus,
  chargeController.getChargesByMerchant,
);

router.get(
  '/history/:chargeId',
  verifyToken,
  checkUserActive,
  checkTenantActive,
  checkTenantAccess,
  checkSubscriptionStatus,
  chargeController.getPaymentHistoryByCharge,
);

router.post(
  "/:id/receipts",
  verifyToken,
  authorizeRoles(ROLES.COLLECTOR, ROLES.TENANT_ADMIN),
  checkUserActive,
  checkTenantActive,
  checkTenantAccess,
  checkSubscriptionStatus,
  uploadReceiptImage.single("payment_image"),
  chargeController.createReceiptForCharge,
);

router.patch(
  "/:id/status",
  verifyToken,
  authorizeRoles(ROLES.TENANT_ADMIN),
  checkUserActive,
  checkTenantActive,
  checkTenantAccess,
  checkSubscriptionStatus,
  chargeController.updateChargeStatus,
);

router.patch(
  "/:id/debt_status",
  verifyToken,
  authorizeRoles(ROLES.TENANT_ADMIN),
  checkUserActive,
  checkTenantActive,
  checkTenantAccess,
  checkSubscriptionStatus,
  chargeController.updateDebtStatus,
);

router.get(
  "/:id",
  verifyToken,
  checkUserActive, checkTenantActive, checkSubscriptionStatus,
  chargeController.getChargesById,
);
router.get(
  "/:id/history",
  verifyToken,
  checkUserActive,
  checkTenantActive,
  checkTenantAccess,
  checkSubscriptionStatus,
  chargeController.getChargeHistory,
);

module.exports = router;
