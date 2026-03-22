const express = require("express");
const router = express.Router();
const notificationController = require("../controllers/notification.controller");
const { ROLES } = require("../constants/role");
const { verifyToken } = require("../middlewares/auth.middleware");
const { authorizeRoles } = require("../middlewares/role.middleware");
const paginate = require("../middlewares/paginate");
const { checkUserActive } = require("../middlewares/checkUserActive.middlewares");
const { checkTenantActive } = require("../middlewares/checkTenantActive.middlewares");
const { checkTenantAccess } = require("../middlewares/checkTenantAccess.middleware");
const { checkSubscriptionStatus } = require("../middlewares/checkSubscription.middlewares");

router.post(
  "/",
  verifyToken,
  authorizeRoles(ROLES.TENANT_ADMIN, ROLES.SUPER_ADMIN),
  checkUserActive,
  notificationController.createNotification,
);

router.get(
  "/",
  verifyToken,
  checkUserActive,
  paginate,
  notificationController.getNotifications,
);

router.get(
  "/unread_count",
  verifyToken,
  checkUserActive,
  notificationController.getUnreadCount,
);

router.post(
  "/:id/read",
  verifyToken,
  checkUserActive,
  notificationController.markAsRead,
);

router.get(
  "/:id",
  verifyToken,
  checkUserActive,
  notificationController.getNotificationDetail,
);

module.exports = router;