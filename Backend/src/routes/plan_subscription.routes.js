const express = require("express");
const router = express.Router();
const planSubscription = require("../controllers/plan_subscription.controller");
const { verifyToken } = require("../middlewares/auth.middleware");
const { authorizeRoles } = require("../middlewares/role.middleware");
const { checkSubscriptionStatus } = require("../middlewares/checkSubscription.middlewares");
const { checkTenantAccess } = require("../middlewares/checkTenantAccess.middleware");
const { checkTenantActive } = require("../middlewares/checkTenantActive.middlewares");
const { ROLES } = require("../constants/role");
const { checkUserActive } = require("../middlewares/checkUserActive.middlewares");

router.post("/", verifyToken, authorizeRoles(ROLES.SUPER_ADMIN), checkUserActive, planSubscription.createSubscription);
router.get("/", verifyToken, authorizeRoles(ROLES.SUPER_ADMIN, ROLES.TENANT_ADMIN), checkUserActive, planSubscription.getSubscriptionById);
router.get("/status", verifyToken, authorizeRoles(ROLES.SUPER_ADMIN), checkUserActive, planSubscription.updateSubscription);
router.get("/list", verifyToken, authorizeRoles(ROLES.SUPER_ADMIN,ROLES.TENANT_ADMIN), checkUserActive, planSubscription.listSubscriptions);

module.exports = router;