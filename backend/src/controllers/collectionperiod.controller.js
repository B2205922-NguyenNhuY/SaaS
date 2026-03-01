const { CollectionPeriod, Charge, FeeSchedule, FeeAssignment, Kiosk, KioskAssignment, Merchant, Shift, User } = require('../models');
const AuditService = require('../services/auditlog.service');
const NotificationService = require('../services/notification.service');
const { Op } = require('sequelize');
const moment = require('moment');

class CollectionController {
  // COLLECTION PERIOD
  async createPeriod(req, res) {
    try {
      const { tenKyThu, ngayBatDau, ngayKetThuc, loaiKy } = req.body;

      const period = await CollectionPeriod.create({
        tenant_id: req.tenant_id,
        tenKyThu,
        ngayBatDau,
        ngayKetThuc,
        loaiKy
      });

      await AuditService.log({
        tenant_id: req.tenant_id,
        user_id: req.user.user_id,
        hanhDong: 'CREATE_PERIOD',
        entity_type: 'collection_period',
        entity_id: period.period_id,
        giaTriMoi: period.toJSON()
      });

      res.status(201).json(period);
    } catch (error) {
      if (error.name === 'SequelizeUniqueConstraintError') {
        return res.status(400).json({ message: 'Period with this date range already exists' });
      }
      res.status(500).json({ message: error.message });
    }
  }

  async getAllPeriods(req, res) {
    try {
      const { page = 1, limit = 10, loaiKy, fromDate, toDate } = req.query;
      const offset = (page - 1) * limit;

      const where = { tenant_id: req.tenant_id };
      if (loaiKy) where.loaiKy = loaiKy;
      if (fromDate || toDate) {
        where.ngayBatDau = {};
        if (fromDate) where.ngayBatDau[Op.gte] = fromDate;
        if (toDate) where.ngayKetThuc[Op.lte] = toDate;
      }

      const { count, rows } = await CollectionPeriod.findAndCountAll({
        where,
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [['ngayBatDau', 'DESC']]
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

  // CHARGE
  async generateCharges(req, res) {
    try {
      const { period_id } = req.params;

      const period = await CollectionPeriod.findOne({
        where: {
          period_id,
          tenant_id: req.tenant_id
        }
      });

      if (!period) {
        return res.status(404).json({ message: 'Period not found' });
      }

      // Lấy tất cả kiosk đang có người thuê
      const activeAssignments = await KioskAssignment.findAll({
        where: {
          tenant_id: req.tenant_id,
          trangThai: 'active'
        },
        include: [
          {
            model: Kiosk,
            as: 'kiosk'
          },
          {
            model: Merchant,
            as: 'merchant'
          }
        ]
      });

      const charges = [];
      const errors = [];

      for (const assignment of activeAssignments) {
        try {
          // Tìm fee áp dụng cho kiosk này
          const fee = await this.getApplicableFee(
            req.tenant_id,
            assignment.kiosk_id,
            assignment.kiosk.zone_id,
            assignment.kiosk.type_id
          );

          if (!fee) {
            errors.push(`No fee found for kiosk ${assignment.kiosk.maKiosk}`);
            continue;
          }

          // Tính số tiền phải thu
          const soTienPhaiThu = await this.calculateAmount(
            fee,
            period,
            assignment.kiosk
          );

          // Kiểm tra đã có charge chưa
          const existingCharge = await Charge.findOne({
            where: {
              tenant_id: req.tenant_id,
              period_id,
              kiosk_id: assignment.kiosk_id
            }
          });

          if (existingCharge) {
            errors.push(`Charge already exists for kiosk ${assignment.kiosk.maKiosk}`);
            continue;
          }

          // Tạo charge
          const charge = await Charge.create({
            tenant_id: req.tenant_id,
            period_id,
            kiosk_id: assignment.kiosk_id,
            merchant_id: assignment.merchant_id,
            fee_id: fee.fee_id,
            donGiaApDung: fee.donGia,
            hinhThucApDung: fee.hinhThuc,
            soTienPhaiThu,
            trangThai: 'chua_thu'
          });

          charges.push(charge);
        } catch (error) {
          errors.push(`Error for kiosk ${assignment.kiosk.maKiosk}: ${error.message}`);
        }
      }

      await AuditService.log({
        tenant_id: req.tenant_id,
        user_id: req.user.user_id,
        hanhDong: 'GENERATE_CHARGES',
        entity_type: 'collection_period',
        entity_id: period_id,
        giaTriMoi: { charges_created: charges.length, errors }
      });

      res.json({
        message: `Generated ${charges.length} charges`,
        charges,
        errors
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  async getAllCharges(req, res) {
    try {
      const {
        page = 1,
        limit = 10,
        period_id,
        kiosk_id,
        merchant_id,
        trangThai,
        fromDate,
        toDate
      } = req.query;
      const offset = (page - 1) * limit;

      const where = { tenant_id: req.tenant_id };
      if (period_id) where.period_id = period_id;
      if (kiosk_id) where.kiosk_id = kiosk_id;
      if (merchant_id) where.merchant_id = merchant_id;
      if (trangThai) where.trangThai = trangThai;

      if (fromDate || toDate) {
        where.created_at = {};
        if (fromDate) where.created_at[Op.gte] = fromDate;
        if (toDate) where.created_at[Op.lte] = toDate;
      }

      const { count, rows } = await Charge.findAndCountAll({
        where,
        include: [
          {
            model: CollectionPeriod,
            as: 'period',
            attributes: ['tenKyThu', 'ngayBatDau', 'ngayKetThuc']
          },
          {
            model: Kiosk,
            as: 'kiosk',
            attributes: ['maKiosk', 'viTri']
          },
          {
            model: Merchant,
            as: 'merchant',
            attributes: ['hoTen', 'soDienThoai']
          }
        ],
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

  // Cập nhật trạng thái nợ
  async updateChargeStatus(req, res) {
    try {
      const { id } = req.params;
      const { trangThai, ghiChu } = req.body;

      const charge = await Charge.findOne({
        where: {
          charge_id: id,
          tenant_id: req.tenant_id
        }
      });

      if (!charge) {
        return res.status(404).json({ message: 'Charge not found' });
      }

      const oldData = charge.toJSON();
      await charge.update({ trangThai });

      await AuditService.log({
        tenant_id: req.tenant_id,
        user_id: req.user.user_id,
        hanhDong: 'UPDATE_CHARGE_STATUS',
        entity_type: 'charge',
        entity_id: charge.charge_id,
        giaTriCu: { trangThai: oldData.trangThai },
        giaTriMoi: { trangThai }
      });

      res.json(charge);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  // Lịch sử công nợ
  async getChargeHistory(req, res) {
    try {
      const { id } = req.params;

      const charge = await Charge.findOne({
        where: {
          charge_id: id,
          tenant_id: req.tenant_id
        },
        include: [
          {
            model: Receipt,
            as: 'Receipts',
            through: { attributes: ['soTienDaTra'] }
          }
        ]
      });

      if (!charge) {
        return res.status(404).json({ message: 'Charge not found' });
      }

      res.json(charge);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  // SHIFT
  async startShift(req, res) {
    try {
      // Kiểm tra đã có ca đang mở chưa
      const activeShift = await Shift.findOne({
        where: {
          tenant_id: req.tenant_id,
          user_id: req.user.user_id,
          thoiGianKetThucCa: null
        }
      });

      if (activeShift) {
        return res.status(400).json({ message: 'You already have an active shift' });
      }

      const shift = await Shift.create({
        tenant_id: req.tenant_id,
        user_id: req.user.user_id,
        thoiGianBatDauCa: new Date()
      });

      await AuditService.log({
        tenant_id: req.tenant_id,
        user_id: req.user.user_id,
        hanhDong: 'START_SHIFT',
        entity_type: 'shift',
        entity_id: shift.shift_id,
        giaTriMoi: shift.toJSON()
      });

      res.status(201).json(shift);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  async endShift(req, res) {
    try {
      const shift = await Shift.findOne({
        where: {
          tenant_id: req.tenant_id,
          user_id: req.user.user_id,
          thoiGianKetThucCa: null
        }
      });

      if (!shift) {
        return res.status(404).json({ message: 'No active shift found' });
      }

      // Tính tổng tiền trong ca
      const receipts = await Receipt.findAll({
        where: {
          tenant_id: req.tenant_id,
          shift_id: shift.shift_id
        }
      });

      const tongTienMat = receipts
        .filter(r => r.hinhThucThanhToan === 'tien_mat')
        .reduce((sum, r) => sum + parseFloat(r.soTienThu), 0);

      const tongChuyenKhoan = receipts
        .filter(r => r.hinhThucThanhToan === 'chuyen_khoan')
        .reduce((sum, r) => sum + parseFloat(r.soTienThu), 0);

      await shift.update({
        thoiGianKetThucCa: new Date(),
        tongTienMatThuDuoc: tongTienMat,
        tongChuyenKhoanThuDuoc: tongChuyenKhoan,
        trangThaiDoiSoat: 'pending'
      });

      await AuditService.log({
        tenant_id: req.tenant_id,
        user_id: req.user.user_id,
        hanhDong: 'END_SHIFT',
        entity_type: 'shift',
        entity_id: shift.shift_id,
        giaTriCu: { thoiGianKetThucCa: null },
        giaTriMoi: { thoiGianKetThucCa: new Date() }
      });

      res.json(shift);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  async getAllShifts(req, res) {
    try {
      const { page = 1, limit = 10, user_id, fromDate, toDate } = req.query;
      const offset = (page - 1) * limit;

      const where = { tenant_id: req.tenant_id };
      if (user_id) where.user_id = user_id;

      if (fromDate || toDate) {
        where.thoiGianBatDauCa = {};
        if (fromDate) where.thoiGianBatDauCa[Op.gte] = fromDate;
        if (toDate) where.thoiGianBatDauCa[Op.lte] = toDate;
      }

      const { count, rows } = await Shift.findAndCountAll({
        where,
        include: [{
          model: User,
          as: 'user',
          attributes: ['hoTen', 'email']
        }],
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [['thoiGianBatDauCa', 'DESC']]
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

  // Helper methods
  async getApplicableFee(tenant_id, kiosk_id, zone_id, type_id) {
    // Ưu tiên: kiosk > zone > kiosk_type
    const assignments = await FeeAssignment.findAll({
      where: {
        tenant_id,
        trangThai: 'active',
        [Op.or]: [
          { target_type: 'kiosk', target_id: kiosk_id },
          { target_type: 'zone', target_id: zone_id },
          { target_type: 'kiosk_type', target_id: type_id }
        ]
      },
      include: [{
        model: FeeSchedule,
        as: 'fee'
      }],
      order: [
        [Op.literal(`
          CASE target_type
            WHEN 'kiosk' THEN 1
            WHEN 'zone' THEN 2
            WHEN 'kiosk_type' THEN 3
          END
        `), 'ASC']
      ]
    });

    return assignments[0]?.fee;
  }

  async calculateAmount(fee, period, kiosk) {
    let amount = parseFloat(fee.donGia);

    if (fee.hinhThuc === 'ngay') {
      const days = moment(period.ngayKetThuc).diff(moment(period.ngayBatDau), 'days') + 1;
      amount = amount * days;
    }

    // Có thể nhân với diện tích nếu cần
    if (kiosk.dienTich) {
      // amount = amount * kiosk.dienTich; // Nếu tính theo diện tích
    }

    return amount;
  }
}

module.exports = new CollectionController();
