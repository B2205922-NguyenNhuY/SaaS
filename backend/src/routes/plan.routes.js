const express = require("express");
const router = express.Router();
const planController = require("../controllers/plan.controller");
const { verifyToken } = require("../middlewares/auth.middleware");
const { authorizeRoles } = require("../middlewares/role.middleware");
const { checkSubscriptionStatus } = require("../middlewares/checkSubscription.middlewares");
const { checkTenantAccess } = require("../middlewares/checkTenantAccess.middleware");
const { checkTenantActive } = require("../middlewares/checkTenantActive.middlewares");
 
const { ROLES } = require("../constants/role");

router.post("/", verifyToken, authorizeRoles(ROLES.SUPER_ADMIN), planController.createPlan);
router.get("/", verifyToken, authorizeRoles(ROLES.SUPER_ADMIN, ROLES.TENANT_ADMIN), checkTenantActive,planController.getAllPlans);
router.get("/:id", verifyToken, authorizeRoles(ROLES.SUPER_ADMIN, ROLES.TENANT_ADMIN), checkTenantActive, planController.getPlanById);
router.put("/:id", verifyToken, authorizeRoles(ROLES.SUPER_ADMIN), planController.updatePlan);

module.exports = router;