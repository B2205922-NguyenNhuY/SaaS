const express = require("express");
const router = express.Router();

const chargeController = require("../controllers/charge.controller");
const { ROLES } = require("../constants/role");

const { verifyToken } = require("../middlewares/auth.middleware");
const { authorizeRoles } = require("../middlewares/role.middleware");


// Tạo charge
router.post(
    "/",
    verifyToken,
    authorizeRoles(ROLES.TENANT_ADMIN),
    chargeController.createCharge
);


// Charge theo period
router.get(
    "/period/:period_id",
    verifyToken,
    chargeController.getChargesByPeriod
);


// Charge theo merchant
router.get(
    "/merchant/:merchant_id",
    verifyToken,
    chargeController.getChargesByMerchant
);


// Update status
router.patch(
    "/:id/status",
    verifyToken,
    authorizeRoles(ROLES.TENANT_ADMIN),
    chargeController.updateChargeStatus
);


// Cập nhật trạng thái nợ
router.patch(
    "/:id/debt_status",
    verifyToken,
    authorizeRoles(ROLES.TENANT_ADMIN),
    chargeController.updateDebtStatus
);


// Lịch sử thay đổi charge
router.get(
    "/:id/history",
    verifyToken,
    authorizeRoles(ROLES.TENANT_ADMIN),
    chargeController.getChargeHistory
);


module.exports = router;
