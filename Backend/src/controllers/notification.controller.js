const db = require("../config/db");
const notificationService = require("../services/notification.service");
exports.createNotification = async (req, res, next) => {
  try {
    const result = await notificationService.createNotification(
      req.body,
      req.user,
    );
    res
      .status(201)
      .json({
        message: "Notification created",
        notification_id: result.insertId,
      });
  } catch (err) {
    next(err);
  }
};
exports.getNotifications = async (req, res, next) => {
  try {
    const where = ["tenant_id = ?"];
    const params = [req.user.tenant_id];
    const [[{ total }]] = await db.query(
      `SELECT COUNT(*) total FROM notification WHERE ${where.join(" AND ")}`,
      params,
    );
    const [rows] = await db.query(
      `SELECT * FROM notification WHERE ${where.join(" AND ")} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [...params, req.pagination.limit, req.pagination.offset],
    );
    res.json({
      data: rows,
      meta: {
        page: req.pagination.page,
        limit: req.pagination.limit,
        total,
        totalPages: Math.ceil(total / req.pagination.limit) || 0,
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
    const data = await notificationService.getNotificationDetail(
      req.params.id,
      req.user,
    );
    res.json(data);
  } catch (err) {
    next(err);
  }
};
