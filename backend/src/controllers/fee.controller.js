const { FeeSchedule, FeeAssignment, Kiosk, Zone, KioskType } = require('../models');
const AuditService = require('../services/auditlog.service');
const { Op } = require('sequelize');

class FeeController {
  // Tạo biểu phí
  async createFee(req, res) {
    try {
      const { tenBieuPhi, hinhThuc, donGia, moTa } = req.body;

      const fee = await FeeSchedule.create({
        tenant_id: req.tenant_id,
        tenBieuPhi,
        hinhThuc,
        donGia,
        moTa
      });

      await AuditService.log({
        tenant_id: req.tenant_id,
        user_id: req.user.user_id,
        hanhDong: 'CREATE_FEE',
        entity_type: 'fee_schedule',
        entity_id: fee.fee_id,
        giaTriMoi: fee.toJSON()
      });

      res.status(201).json(fee);
    } catch (error) {
      if (error.name === 'SequelizeUniqueConstraintError') {
        return res.status(400).json({ message: 'Fee name already exists' });
      }
      res.status(500).json({ message: error.message });
    }
  }

  // Lấy danh sách biểu phí
  async getAllFees(req, res) {
    try {
      const { page = 1, limit = 10, hinhThuc } = req.query;
      const offset = (page - 1) * limit;

      const where = { tenant_id: req.tenant_id };
      if (hinhThuc) where.hinhThuc = hinhThuc;

      const { count, rows } = await FeeSchedule.findAndCountAll({
        where,
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [['created_at', 'DESC']]
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

  // Cập nhật biểu phí
  async updateFee(req, res) {
    try {
      const fee = await FeeSchedule.findOne({
        where: {
          fee_id: req.params.id,
          tenant_id: req.tenant_id
        }
      });

      if (!fee) {
        return res.status(404).json({ message: 'Fee not found' });
      }

      const oldData = fee.toJSON();
      await fee.update(req.body);

      await AuditService.log({
        tenant_id: req.tenant_id,
        user_id: req.user.user_id,
        hanhDong: 'UPDATE_FEE',
        entity_type: 'fee_schedule',
        entity_id: fee.fee_id,
        giaTriCu: oldData,
        giaTriMoi: fee.toJSON()
      });

      res.json(fee);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  // Áp dụng biểu phí
  async applyFee(req, res) {
    try {
      const { fee_id, target_type, target_id, ngayApDung, mucMienGiam } = req.body;

      // Kiểm tra fee
      const fee = await FeeSchedule.findOne({
        where: {
          fee_id,
          tenant_id: req.tenant_id
        }
      });

      if (!fee) {
        return res.status(404).json({ message: 'Fee not found' });
      }

      // Kiểm tra target tồn tại
      await this.validateTarget(target_type, target_id, req.tenant_id);

      // Vô hiệu hóa các assignment cũ
      await FeeAssignment.update(
        { trangThai: 'inactive' },
        {
          where: {
            tenant_id: req.tenant_id,
            fee_id,
            target_type,
            target_id,
            trangThai: 'active'
          }
        }
      );

      // Tạo assignment mới
      const assignment = await FeeAssignment.create({
        tenant_id: req.tenant_id,
        fee_id,
        target_type,
        target_id,
        ngayApDung,
        mucMienGiam: mucMienGiam || 0
      });

      await AuditService.log({
        tenant_id: req.tenant_id,
        user_id: req.user.user_id,
        hanhDong: 'APPLY_FEE',
        entity_type: 'fee_assignment',
        entity_id: assignment.assignment_id,
        giaTriMoi: assignment.toJSON()
      });

      res.status(201).json(assignment);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  // Lấy danh sách fee đang áp dụng
  async getActiveAssignments(req, res) {
    try {
      const { target_type, target_id } = req.query;

      const where = {
        tenant_id: req.tenant_id,
        trangThai: 'active'
      };

      if (target_type) where.target_type = target_type;
      if (target_id) where.target_id = target_id;

      const assignments = await FeeAssignment.findAll({
        where,
        include: [{
          model: FeeSchedule,
          as: 'fee'
        }],
        order: [['created_at', 'DESC']]
      });

      res.json(assignments);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  // Kiểm tra target tồn tại
  async validateTarget(target_type, target_id, tenant_id) {
    let model;
    switch (target_type) {
      case 'kiosk':
        model = Kiosk;
        break;
      case 'zone':
        model = Zone;
        break;
      case 'kiosk_type':
        model = KioskType;
        break;
      default:
        throw new Error('Invalid target type');
    }

    const where = target_type === 'kiosk_type' 
      ? { type_id: target_id }
      : { [target_type === 'kiosk' ? 'kiosk_id' : 'zone_id']: target_id, tenant_id };

    const instance = await model.findOne({ where });
    if (!instance) {
      throw new Error(`${target_type} not found`);
    }
  }
}

module.exports = new FeeController();
