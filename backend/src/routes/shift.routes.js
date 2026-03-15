const express = require("express");
const router = express.Router();
const controller = require("../controllers/shift.controller");
const { verifyToken } = require("../middlewares/auth.middleware");
const { authorizeRoles } = require("../middlewares/role.middleware");
const paginate = require("../middlewares/paginate");
const { ROLES } = require("../constants/role");
router.post(
  "/start",
  verifyToken,
  authorizeRoles(ROLES.COLLECTOR),
  controller.startShift,
);
router.post(
  "/end",
  verifyToken,
  authorizeRoles(ROLES.COLLECTOR),
  controller.endShift,
);
router.put(
  "/end/:id",
  verifyToken,
  authorizeRoles(ROLES.COLLECTOR),
  controller.endShift,
);
router.get(
  "/",
  verifyToken,
  authorizeRoles(ROLES.TENANT_ADMIN),
  paginate,
  controller.getShifts,
);
router.get(
  "/active",
  verifyToken,
  authorizeRoles(ROLES.COLLECTOR),
  controller.getActiveShift,
);
module.exports = router;
