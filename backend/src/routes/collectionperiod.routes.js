const express = require("express");
const router = express.Router();

const controller = require("../controllers/collectionperiod.controller");
const { ROLES } = require("../constants/role");

const { verifyToken } = require("../middlewares/auth.middleware");
const { authorizeRoles } = require("../middlewares/role.middleware");


router.post(
    "/",
    verifyToken,
    authorizeRoles(ROLES.TENANT_ADMIN),
    controller.createPeriod
);


router.get(
    "/",
    verifyToken,
    controller.getPeriods
);


router.get(
    "/:id",
    verifyToken,
    controller.getPeriodDetail
);


router.put(
    "/:id",
    verifyToken,
    authorizeRoles(ROLES.TENANT_ADMIN),
    controller.updatePeriod
);


router.delete(
    "/:id",
    verifyToken,
    authorizeRoles(ROLES.TENANT_ADMIN),
    controller.deletePeriod
);


module.exports = router;