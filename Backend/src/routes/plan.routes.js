const express = require("express");
const router = express.Router();
const planController = require("../controllers/plan.controller");
const { verifyToken } = require("../middlewares/auth.middleware");
const { authorizeRoles } = require("../middlewares/role.middleware");
const { checkSubscriptionStatus } = require("../middlewares/checkSubscription.middlewares");
const { checkTenantAccess } = require("../middlewares/checkTenantAccess.middleware");
const { checkTenantActive } = require("../middlewares/checkTenantActive.middlewares");
 
const { ROLES } = require("../constants/role");
const { checkUserActive } = require("../middlewares/checkUserActive.middlewares");

router.post("/", verifyToken, authorizeRoles(ROLES.SUPER_ADMIN), checkUserActive, planController.createPlan);
router.get("/", verifyToken, authorizeRoles(ROLES.SUPER_ADMIN, ROLES.TENANT_ADMIN), checkUserActive, checkTenantActive,planController.getAllPlans);
router.get("/:id", verifyToken, authorizeRoles(ROLES.SUPER_ADMIN, ROLES.TENANT_ADMIN), checkUserActive, checkTenantActive, planController.getPlanById);
router.put("/:id", verifyToken, authorizeRoles(ROLES.SUPER_ADMIN), checkUserActive, planController.updatePlan);

module.exports = router;