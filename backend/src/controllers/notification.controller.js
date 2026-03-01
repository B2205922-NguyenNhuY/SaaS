const { Notification } = require('../models');
const { Op } = require('sequelize');

class NotificationController {
  // Tạo thông báo
  async create(req, res) {
    try {
      const { type, title, content, target_users, expires_at } = req.body;

      const notification = {
        notification_id: Date.now(),
        tenant_id: req.tenant_id,
        created_by: req.user.user_id,
        type,
        title,
        content,
        target_users,
        expires_at,
        created_at: new Date()
      };

      res.status(201).json(notification);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  // Lấy danh sách thông báo
  async getAll(req, res) {
    try {
      const { page = 1, limit = 20, type, is_read } = req.query;
      const offset = (page - 1) * limit;

      const notifications = [];

      res.json({
        total: 0,
        page: parseInt(page),
        limit: parseInt(limit),
        data: notifications
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  // Đánh dấu đã đọc
  async markAsRead(req, res) {
    try {
      const { id } = req.params;

      res.json({ message: 'Notification marked as read' });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  // Đánh dấu tất cả đã đọc
  async markAllAsRead(req, res) {
    try {
   
      res.json({ message: 'All notifications marked as read' });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  //   Xem thông báo chi tiết
  //   GET /api/notifications/:id
     async getNotificationById(req, res, next) {
      try {
        const notification = await Notification.findOne({
          where: {
            notification_id: req.params.id,
            user_id: req.user.user_id,
            tenant_id: req.user.tenant_id
          },
          include: [
            {
              model: User,
              as: 'sender',
              attributes: ['user_id', 'hoTen']
            }
          ]
        });

        if (!notification) {
          return next(new AppError('Không tìm thấy thông báo', 404));
        }

        // Mark as read if not already
        if (!notification.daDoc) {
          await notification.update({
            daDoc: true,
            ngayDoc: new Date()
          });
        }

        successResponse(res, { notification }, 'Lấy thông báo thành công');
      } catch (error) {
        next(error);
      }
    }
  }

module.exports = new NotificationController();
