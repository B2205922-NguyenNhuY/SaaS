const express = require("express");
const router = express.Router();
const roleController = require("../controllers/role.controller");
const { verifyToken } = require("../middlewares/auth.middleware");
const { authorizeRoles } = require("../middlewares/role.middleware");
const { checkSubscriptionStatus } = require("../middlewares/checkSubscription.middlewares");
const { checkTenantAccess } = require("../middlewares/checkTenantAccess.middleware");
const { checkTenantActive } = require("../middlewares/checkTenantActive.middlewares");
const { ROLES } = require("../constants/role");

router.post("/",verifyToken, authorizeRoles(ROLES.SUPER_ADMIN), roleController.createRole);
router.get("/", verifyToken, authorizeRoles(ROLES.SUPER_ADMIN, ROLES.TENANT_ADMIN), checkTenantActive, roleController.getAllRoles);
router.get("/:id", verifyToken, authorizeRoles(ROLES.SUPER_ADMIN, ROLES.TENANT_ADMIN), checkTenantActive, roleController.getRoleById);
router.put("/:id", verifyToken, authorizeRoles(ROLES.SUPER_ADMIN), roleController.updateRole);

module.exports = router;