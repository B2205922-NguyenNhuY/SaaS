const express = require("express");
const router = express.Router();
const notificationController = require("../controllers/notification.controller");
const { ROLES } = require("../constants/role");
const { verifyToken } = require("../middlewares/auth.middleware");
const { authorizeRoles } = require("../middlewares/role.middleware");
const paginate = require("../middlewares/paginate");
router.post(
  "/",
  verifyToken,
  authorizeRoles(ROLES.TENANT_ADMIN, ROLES.SUPER_ADMIN),
  notificationController.createNotification,
);
router.get("/", verifyToken, paginate, notificationController.getNotifications);
router.get("/unread_count", verifyToken, notificationController.getUnreadCount);
router.post("/:id/read", verifyToken, notificationController.markAsRead);
router.get("/:id", verifyToken, notificationController.getNotificationDetail);
module.exports = router;
