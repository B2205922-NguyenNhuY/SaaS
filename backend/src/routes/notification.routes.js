const express = require("express");
const router = express.Router();
const notificationController = require("../controllers/notification.controller");
const { ROLES } = require("../constants/role");
const { verifyToken } = require("../middlewares/auth.middleware");
const { authorizeRoles } = require("../middlewares/role.middleware");


// Tạo thông báo (tenant admin hoặc super admin) 
router.post(
    "/",
    verifyToken,
    authorizeRoles(ROLES.TENANT_ADMIN, ROLES.SUPER_ADMIN),
    notificationController.createNotification
);


// Danh sách notification
router.get(
    "/",
    verifyToken,
    notificationController.getNotifications
);


// Unread count
router.get(
    "/unread_count",
    verifyToken,
    notificationController.getUnreadCount
);


// Mark read
router.post(
    "/:id/read",
    verifyToken,
    notificationController.markAsRead
);


// Chi tiết notification
router.get(
    "/:id",
    verifyToken,
    notificationController.getNotificationDetail
);

module.exports = router;