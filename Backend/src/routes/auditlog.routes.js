const express = require("express");
const router = express.Router();
const auditLogController = require("../controllers/auditlog.controller");
const { ROLES } = require("../constants/role");
const { verifyToken } = require("../middlewares/auth.middleware");
const { authorizeRoles } = require("../middlewares/role.middleware");
const paginate = require("../middlewares/paginate");
const { checkUserActive } = require("../middlewares/checkUserActive.middlewares");
const { checkTenantActive } = require("../middlewares/checkTenantActive.middlewares");
const { checkTenantAccess } = require("../middlewares/checkTenantAccess.middleware");
const { checkSubscriptionStatus } = require("../middlewares/checkSubscription.middlewares");
router.get(
  "/",
  verifyToken,
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.TENANT_ADMIN),
  checkUserActive,
  paginate,
  auditLogController.getAllLogs,
);
router.get(
  "/superadmin",
  verifyToken,
  authorizeRoles(ROLES.SUPER_ADMIN),
  checkUserActive,
  paginate,
  auditLogController.getSuperAdminLogs,
);
router.get(
  "/tenant",
  verifyToken,
  authorizeRoles(ROLES.TENANT_ADMIN),
  checkUserActive, checkTenantActive, checkSubscriptionStatus,
  paginate,
  auditLogController.getTenantLogs,
);
router.get(
  "/entity/:entity_type/:entity_id",
  verifyToken,
  authorizeRoles(ROLES.TENANT_ADMIN, ROLES.SUPER_ADMIN),
  checkUserActive, checkTenantActive, checkSubscriptionStatus,
  paginate,
  auditLogController.getEntityLogs,
);
module.exports = router;
