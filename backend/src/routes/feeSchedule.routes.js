const express = require("express");
const router = express.Router();

const controller = require("../controllers/feeSchedule.controller");
const { ROLES } = require("../constants/role");

const { verifyToken } = require("../middlewares/auth.middleware");
const { authorizeRoles } = require("../middlewares/role.middleware");


router.post(
    "/",
    verifyToken,
    authorizeRoles(ROLES.TENANT_ADMIN),
    controller.createFee
);


router.get(
    "/",
    verifyToken,
    controller.getFees
);


router.get(
    "/:id",
    verifyToken,
    controller.getFeeDetail
);


router.put(
    "/:id",
    verifyToken,
    authorizeRoles(ROLES.TENANT_ADMIN),
    controller.updateFee
);


router.delete(
    "/:id",
    verifyToken,
    authorizeRoles(ROLES.TENANT_ADMIN),
    controller.deleteFee
);

module.exports = router;