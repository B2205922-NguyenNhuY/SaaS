const express = require("express");
const router = express.Router();

const auditLogController = require("../controllers/auditlog.controller");
const { ROLES } = require("../constants/role");

const { verifyToken } = require("../middlewares/auth.middleware");
const { authorizeRoles } = require("../middlewares/role.middleware");


// Super admin xem log toàn hệ thống
router.get(
    "/superadmin",
    verifyToken,
    authorizeRoles(ROLES.SUPER_ADMIN),
    auditLogController.getSuperAdminLogs
);

// Tenant admin xem log tenant
router.get(
    "/tenant",
    verifyToken,
    authorizeRoles(ROLES.TENANT_ADMIN),
    auditLogController.getTenantLogs
);


// Log theo entity
router.get(
    "/entity/:entity_type/:entity_id",
    verifyToken,
    authorizeRoles(ROLES.TENANT_ADMIN, ROLES.SUPER_ADMIN),
    auditLogController.getEntityLogs
);

module.exports = router;