const express = require("express");
const router = express.Router();
const planController = require("../controllers/plan.controller");
const { verifyToken } = require("../middlewares/auth.middleware");
const { authorizeRoles } = require("../middlewares/role.middleware");
const paginate = require("../middlewares/paginate");
const { ROLES } = require("../constants/role");
router.post(
  "/",
  verifyToken,
  authorizeRoles(ROLES.SUPER_ADMIN),
  planController.createPlan,
);
router.get(
  "/",
  verifyToken,
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.TENANT_ADMIN),
  paginate,
  planController.getAllPlans,
);
router.get(
  "/:id",
  verifyToken,
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.TENANT_ADMIN),
  planController.getPlanById,
);
router.put(
  "/:id",
  verifyToken,
  authorizeRoles(ROLES.SUPER_ADMIN),
  planController.updatePlan,
);
router.patch(
  "/:id/inactive",
  verifyToken,
  authorizeRoles(ROLES.SUPER_ADMIN),
  planController.updateStatus,
);
module.exports = router;
