const notificationService = require("../services/notification.service");


// Tạo notification
exports.createNotification = async (req, res, next) => {

    try {

        const result = await notificationService.createNotification(
            req.body,
            req.user
        );

        res.status(201).json({
            message: "Notification created",
            notification_id: result.insertId
        });

    } catch (err) {
        next(err);
    }
};


// Danh sách notification
exports.getNotifications = async (req, res, next) => {

    try {

        const data = await notificationService.getNotifications(req.user);

        res.json(data);

    } catch (err) {
        next(err);
    }
};


// Unread count
exports.getUnreadCount = async (req, res, next) => {

    try {

        const data = await notificationService.getUnreadCount(req.user);

        res.json(data);

    } catch (err) {
        next(err);
    }
};


// Mark read
exports.markAsRead = async (req, res, next) => {

    try {

        await notificationService.markAsRead(
            req.params.id,
            req.user
        );

        res.json({
            message: "Notification marked as read"
        });

    } catch (err) {
        next(err);
    }
};


// Chi tiết notification
exports.getNotificationDetail = async (req, res, next) => {

    try {

        const data = await notificationService.getNotificationDetail(
            req.params.id,
            req.user
        );

        res.json(data);

    } catch (err) {

        next(err);

    }

};