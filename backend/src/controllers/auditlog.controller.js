const { AuditLog, User } = require('../models');
const { Op } = require('sequelize');

class AuditController {
  // Lấy audit logs
  async getLogs(req, res) {
    try {
      const {
        page = 1,
        limit = 5000,
        user_id,
        entity_type,
        entity_id,
        fromDate,
        toDate,
        hanhDong
      } = req.query;
      const offset = (page - 1) * limit;

      const where = { tenant_id: req.tenant_id };
      
      if (user_id) where.user_id = user_id;
      if (entity_type) where.entity_type = entity_type;
      if (entity_id) where.entity_id = entity_id;
      if (hanhDong) where.hanhDong = { [Op.like]: `%${hanhDong}%` };

      if (fromDate || toDate) {
        where.thoiGianThucHien = {};
        if (fromDate) where.thoiGianThucHien[Op.gte] = fromDate;
        if (toDate) where.thoiGianThucHien[Op.lte] = toDate;
      }

      const { count, rows } = await AuditLog.findAndCountAll({
        where,
        include: [{
          model: User,
          as: 'user',
          attributes: ['user_id', 'hoTen', 'email']
        }],
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [['thoiGianThucHien', 'DESC']]
      });

      res.json({
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        data: rows
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  // Xem chi tiết log
  async getLogById(req, res) {
    try {
      const log = await AuditLog.findOne({
        where: {
          log_id: req.params.id,
          tenant_id: req.tenant_id
        },
        include: [{
          model: User,
          as: 'user',
          attributes: ['hoTen', 'email']
        }]
      });

      if (!log) {
        return res.status(404).json({ message: 'Log not found' });
      }

      if (log.giaTriCu) log.giaTriCu = JSON.parse(log.giaTriCu);
      if (log.giaTriMoi) log.giaTriMoi = JSON.parse(log.giaTriMoi);

      res.json(log);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
}

module.exports = new AuditController();
