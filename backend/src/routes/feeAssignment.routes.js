const express = require("express");
const router = express.Router();
const controller = require("../controllers/feeAssignment.controller");
const { ROLES } = require("../constants/role");
const { verifyToken } = require("../middlewares/auth.middleware");
const { authorizeRoles } = require("../middlewares/role.middleware");
const paginate = require("../middlewares/paginate");
router.post(
  "/",
  verifyToken,
  authorizeRoles(ROLES.TENANT_ADMIN),
  controller.createAssignment,
);
router.get("/", verifyToken, paginate, controller.listAssignments);
router.get("/target", verifyToken, controller.getAssignmentsByTarget);
router.get(
  "/fee/:fee_id",
  verifyToken,
  paginate,
  controller.getAssignmentsByFee,
);
router.get("/:id", verifyToken, controller.getAssignmentById);
router.put(
  "/:id",
  verifyToken,
  authorizeRoles(ROLES.TENANT_ADMIN),
  controller.updateAssignment,
);
router.patch(
  "/:id/deactivate",
  verifyToken,
  authorizeRoles(ROLES.TENANT_ADMIN),
  controller.deactivateAssignment,
);
module.exports = router;
