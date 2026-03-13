const express = require("express");
const router = express.Router();

const controller = require("../controllers/feeAssignment.controller");
const { ROLES } = require("../constants/role");

const { verifyToken } = require("../middlewares/auth.middleware");
const { authorizeRoles } = require("../middlewares/role.middleware");


// Tạo fee assignment
router.post(
    "/",
    verifyToken,
    authorizeRoles(ROLES.TENANT_ADMIN),
    controller.createAssignment
);


// Lấy assignment theo target
router.get(
    "/target",
    verifyToken,
    controller.getAssignmentsByTarget
);


// Lấy assignment theo fee
router.get(
    "/fee/:fee_id",
    verifyToken,
    controller.getAssignmentsByFee
);


// Deactivate
router.patch(
    "/:id/deactivate",
    verifyToken,
    authorizeRoles(ROLES.TENANT_ADMIN),
    controller.deactivateAssignment
);

module.exports = router;