const express = require("express");
const router = express.Router();
const planSubscription = require("../controllers/plan_subscription.controller");
const { verifyToken } = require("../middlewares/auth.middleware");
const { authorizeRoles } = require("../middlewares/role.middleware");
const { checkSubscriptionStatus } = require("../middlewares/checkSubscription.middlewares");
const { checkTenantAccess } = require("../middlewares/checkTenantAccess.middleware");
const { checkTenantActive } = require("../middlewares/checkTenantActive.middlewares");
const { ROLES } = require("../constants/role");

router.post("/", verifyToken, authorizeRoles(ROLES.TENANT_ADMIN), checkTenantAccess, checkTenantActive, checkSubscriptionStatus, planSubscription.createSubscription);
router.get("/", verifyToken, authorizeRoles(ROLES.TENANT_ADMIN), checkTenantAccess, checkTenantActive, checkSubscriptionStatus, planSubscription.getSubscriptionById);
router.get("/status", verifyToken, authorizeRoles(ROLES.TENANT_ADMIN), checkTenantAccess, checkTenantActive, checkSubscriptionStatus, planSubscription.updateSubscription);

module.exports = router;