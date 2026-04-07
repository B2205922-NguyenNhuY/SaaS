const notificationService = require("../services/notification.service");
const auditLogModel = require("../models/auditLog.model");

exports.createNotification = async (req, res, next) => {
  try {
    const result = await notificationService.createNotification(req.body, req.user);
    await logAudit(req, {
      action: "CREATE_NOTIFICATION",
      entity_type: "notification",
      entity_id: result.insertId,
      newValue: req.body,
    });
    res.status(201).json({
      message: "Notification created",
      notification_id: result.insertId,
    });
  } catch (err) { next(err); }
};

exports.getNotifications = async (req, res, next) => {
  try {
    const result = await notificationService.getNotifications(req.user, req.pagination);
    const rows = result.rows || result;
    const total = result.total || rows.length;
    res.json({
      data: rows,
      meta: {
        page: req.pagination.page,
        limit: req.pagination.limit,
        total,
        totalPages: Math.ceil(total / req.pagination.limit) || 1,
      },
    });
  } catch (err) {
    next(err);
  }
};

exports.getMyNotifications = async (req, res, next) => {
  try {
    const result = await notificationService.getMyNotifications(req.user);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

exports.getUnreadCount = async (req, res, next) => {
  try {
    const data = await notificationService.getUnreadCount(req.user);
    res.json(data);
  } catch (err) {
    next(err);
  }
};

exports.markAsRead = async (req, res, next) => {
  try {
    await notificationService.markAsRead(req.params.id, req.user);
    res.json({ message: "Notification marked as read" });
  } catch (err) {
    next(err);
  }
};

exports.getNotificationDetail = async (req, res, next) => {
  try {
    const data = await notificationService.getNotificationDetail(req.params.id, req.user);
    res.json(data);
  } catch (err) {
    next(err);
  }
};