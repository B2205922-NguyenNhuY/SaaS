const { Merchant, KioskAssignment, Kiosk } = require('../models');
const AuditService = require('../services/auditlog.service');
const { Op } = require('sequelize');

class MerchantController {
  // Tạo tiểu thương mới
  async create(req, res) {
    try {
      const { hoTen, soDienThoai, CCCD, maSoThue, diaChiThuongTru, ngayThamGiaKinhDoanh } = req.body;

      // Kiểm tra CCCD đã tồn tại
      if (CCCD) {
        const existingMerchant = await Merchant.findOne({
          where: {
            tenant_id: req.tenant_id,
            CCCD
          }
        });

        if (existingMerchant) {
          return res.status(400).json({ message: 'CCCD already exists' });
        }
      }

      const merchant = await Merchant.create({
        tenant_id: req.tenant_id,
        hoTen,
        soDienThoai,
        CCCD,
        maSoThue,
        diaChiThuongTru,
        ngayThamGiaKinhDoanh
      });

      await AuditService.log({
        tenant_id: req.tenant_id,
        user_id: req.user.user_id,
        hanhDong: 'CREATE_MERCHANT',
        entity_type: 'merchant',
        entity_id: merchant.merchant_id,
        giaTriMoi: merchant.toJSON()
      });

      res.status(201).json(merchant);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  // Lấy danh sách tiểu thương
  async getAll(req, res) {
    try {
      const { page = 1, limit = 10, search, trangThai } = req.query;
      const offset = (page - 1) * limit;

      const where = { tenant_id: req.tenant_id };
      
      if (search) {
        where[Op.or] = [
          { hoTen: { [Op.like]: `%${search}%` } },
          { soDienThoai: { [Op.like]: `%${search}%` } },
          { CCCD: { [Op.like]: `%${search}%` } }
        ];
      }
      if (trangThai) where.trangThai = trangThai;

      const { count, rows } = await Merchant.findAndCountAll({
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

  // Lấy chi tiết tiểu thương
  async getById(req, res) {
    try {
      const merchant = await Merchant.findOne({
        where: {
          merchant_id: req.params.id,
          tenant_id: req.tenant_id
        },
        include: [{
          model: KioskAssignment,
          as: 'KioskAssignments',
          include: [{
            model: Kiosk,
            as: 'kiosk'
          }]
        }]
      });

      if (!merchant) {
        return res.status(404).json({ message: 'Merchant not found' });
      }

      res.json(merchant);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  // Cập nhật tiểu thương
  async update(req, res) {
    try {
      const merchant = await Merchant.findOne({
        where: {
          merchant_id: req.params.id,
          tenant_id: req.tenant_id
        }
      });

      if (!merchant) {
        return res.status(404).json({ message: 'Merchant not found' });
      }

      const oldData = merchant.toJSON();
      await merchant.update(req.body);

      await AuditService.log({
        tenant_id: req.tenant_id,
        user_id: req.user.user_id,
        hanhDong: 'UPDATE_MERCHANT',
        entity_type: 'merchant',
        entity_id: merchant.merchant_id,
        giaTriCu: oldData,
        giaTriMoi: merchant.toJSON()
      });

      res.json(merchant);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  // Gán kiosk cho tiểu thương
  async assignKiosk(req, res) {
    try {
      const { merchant_id, kiosk_id, ngayBatDau, ngayKetThuc } = req.body;

      // Kiểm tra merchant
      const merchant = await Merchant.findOne({
        where: {
          merchant_id,
          tenant_id: req.tenant_id,
          trangThai: 'active'
        }
      });

      if (!merchant) {
        return res.status(404).json({ message: 'Merchant not found or inactive' });
      }

      // Kiểm tra kiosk
      const kiosk = await Kiosk.findOne({
        where: {
          kiosk_id,
          tenant_id: req.tenant_id
        }
      });

      if (!kiosk) {
        return res.status(404).json({ message: 'Kiosk not found' });
      }

      // Kiểm tra kiosk đã có người thuê active chưa
      const activeAssignment = await KioskAssignment.findOne({
        where: {
          kiosk_id,
          tenant_id: req.tenant_id,
          trangThai: 'active'
        }
      });

      if (activeAssignment) {
        return res.status(400).json({ message: 'Kiosk already has an active assignment' });
      }

      // Tạo assignment mới
      const assignment = await KioskAssignment.create({
        tenant_id: req.tenant_id,
        kiosk_id,
        merchant_id,
        ngayBatDau,
        ngayKetThuc,
        trangThai: 'active'
      });

      // Cập nhật trạng thái kiosk
      await kiosk.update({ trangThai: 'occupied' });

      await AuditService.log({
        tenant_id: req.tenant_id,
        user_id: req.user.user_id,
        hanhDong: 'ASSIGN_KIOSK',
        entity_type: 'kiosk_assignment',
        entity_id: assignment.assignment_id,
        giaTriMoi: assignment.toJSON()
      });

      res.status(201).json(assignment);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  // Kết thúc hợp đồng thuê kiosk
  async endAssignment(req, res) {
    try {
      const { id } = req.params;

      const assignment = await KioskAssignment.findOne({
        where: {
          assignment_id: id,
          tenant_id: req.tenant_id,
          trangThai: 'active'
        }
      });

      if (!assignment) {
        return res.status(404).json({ message: 'Active assignment not found' });
      }

      await assignment.update({
        trangThai: 'ended',
        ngayKetThuc: new Date()
      });

      // Cập nhật trạng thái kiosk
      await Kiosk.update(
        { trangThai: 'available' },
        {
          where: {
            kiosk_id: assignment.kiosk_id,
            tenant_id: req.tenant_id
          }
        }
      );

      await AuditService.log({
        tenant_id: req.tenant_id,
        user_id: req.user.user_id,
        hanhDong: 'END_ASSIGNMENT',
        entity_type: 'kiosk_assignment',
        entity_id: assignment.assignment_id,
        giaTriCu: { trangThai: 'active' },
        giaTriMoi: { trangThai: 'ended' }
      });

      res.json({ message: 'Assignment ended successfully' });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
}

module.exports = new MerchantController();