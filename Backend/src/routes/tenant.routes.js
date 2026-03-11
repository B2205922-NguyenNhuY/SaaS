const express = require("express");
const router = express.Router();
const tenantController = require("../controllers/tenant.cotroller");
const { verifyToken } = require("../middlewares/auth.middleware");
const { authorizeRoles } = require("../middlewares/role.middleware");
const { ROLES } = require("../constants/role");
const { checkTenantAccess } = require("../middlewares/checkTenantAccess.middleware");
const { checkTenantActive } = require("../middlewares/checkTenantActive.middlewares");
const { checkSubscriptionStatus } = require("../middlewares/checkSubscription.middlewares");

router.post("/", verifyToken, authorizeRoles(ROLES.SUPER_ADMIN), tenantController.createTenant);
router.get("/", verifyToken, authorizeRoles(ROLES.SUPER_ADMIN), tenantController.getAllTenants);
router.get("/:id", verifyToken, authorizeRoles(ROLES.SUPER_ADMIN), tenantController.getTenantById);
router.put("/:id", verifyToken, authorizeRoles(ROLES.SUPER_ADMIN, ROLES.TENANT_ADMIN), checkTenantActive, checkTenantAccess, checkSubscriptionStatus, tenantController.updateTenantInfo);
router.patch("/:id/status", verifyToken, authorizeRoles(ROLES.SUPER_ADMIN), tenantController.updateTenantStatus);

module.exports = router;