const express = require("express");
const router = express.Router();

const controller = require("../controllers/shift.controller");

const { verifyToken } = require("../middlewares/auth.middleware");
const { authorizeRoles } = require("../middlewares/role.middleware");

const ROLES = require("../constants/role");



router.post(
    "/start",
    verifyToken,
    authorizeRoles(ROLES.COLLECTOR),
    controller.startShift
);



router.put(
    "/end/:id",
    verifyToken,
    authorizeRoles(ROLES.COLLECTOR),
    controller.endShift
);



router.get(
    "/",
    verifyToken,
    authorizeRoles(ROLES.TENANT_ADMIN),
    controller.getShifts
);

module.exports = router;