const express = require("express");
const router = express.Router();
const auditLogController = require("../controllers/auditlog.controller");
const { ROLES } = require("../constants/role");
const { verifyToken } = require("../middlewares/auth.middleware");
const { authorizeRoles } = require("../middlewares/role.middleware");
const paginate = require("../middlewares/paginate");
router.get(
  "/",
  verifyToken,
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.TENANT_ADMIN),
  paginate,
  auditLogController.getAllLogs,
);
router.get(
  "/superadmin",
  verifyToken,
  authorizeRoles(ROLES.SUPER_ADMIN),
  paginate,
  auditLogController.getSuperAdminLogs,
);
router.get(
  "/tenant",
  verifyToken,
  authorizeRoles(ROLES.TENANT_ADMIN),
  paginate,
  auditLogController.getTenantLogs,
);
router.get(
  "/entity/:entity_type/:entity_id",
  verifyToken,
  authorizeRoles(ROLES.TENANT_ADMIN, ROLES.SUPER_ADMIN),
  paginate,
  auditLogController.getEntityLogs,
);
module.exports = router;
