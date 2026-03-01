const { Charge, Kiosk, Merchant, CollectionPeriod, PaymentTransaction, AuditLog } = require('../models');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');
const { successResponse, paginationResponse } = require('../utils/responseHandler');
const { Op } = require('sequelize');

// Xem danh sách khoản thu
// GET /api/charges
const getCharges = catchAsync(async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const offset = (page - 1) * limit;

  const where = { tenant_id: req.user.tenant_id };

  // Filters
  if (req.query.period_id) {
    where.period_id = req.query.period_id;
  }
  if (req.query.kiosk_id) {
    where.kiosk_id = req.query.kiosk_id;
  }
  if (req.query.merchant_id) {
    where.merchant_id = req.query.merchant_id;
  }
  if (req.query.trangThai) {
    where.trangThai = req.query.trangThai;
  }

  // Date range filter
  if (req.query.start_date || req.query.end_date) {
    where.created_at = {};
    if (req.query.start_date) {
      where.created_at[Op.gte] = new Date(req.query.start_date);
    }
    if (req.query.end_date) {
      where.created_at[Op.lte] = new Date(req.query.end_date);
    }
  }

  const { count, rows } = await Charge.findAndCountAll({
    where,
    include: [
      {
        model: Kiosk,
        as: 'kiosk',
        attributes: ['kiosk_id', 'maKiosk', 'viTriChiTiet']
      },
      {
        model: Merchant,
        as: 'merchant',
        attributes: ['merchant_id', 'hoTen', 'soDienThoai']
      },
      {
        model: CollectionPeriod,
        as: 'period',
        attributes: ['period_id', 'tenKyThu']
      }
    ],
    limit,
    offset,
    order: [['created_at', 'DESC']]
  });

  // Calculate summary
  const summary = {
    totalAmount: rows.reduce((sum, c) => sum + parseFloat(c.soTien), 0),
    collectedAmount: rows.reduce((sum, c) => sum + parseFloat(c.soTienDaThu), 0),
    debtAmount: rows.reduce((sum, c) => sum + parseFloat(c.soTienConNo), 0),
    count: {
      total: count,
      collected: rows.filter(c => c.trangThai === 'da_thu').length,
      partial: rows.filter(c => c.trangThai === 'da_thu_mot_phan').length,
      pending: rows.filter(c => c.trangThai === 'chua_thu').length,
      debt: rows.filter(c => c.trangThai === 'no').length
    }
  };

  paginationResponse(res, {
    charges: rows,
    summary
  }, count, page, limit, 'Lấy danh sách khoản thu thành công');
});

// Xem chi tiết khoản thu
// GET /api/charges/{id}
const getChargeById = catchAsync(async (req, res, next) => {
  const charge = await Charge.findOne({
    where: {
      charge_id: req.params.id,
      tenant_id: req.user.tenant_id
    },
    include: [
      {
        model: Kiosk,
        as: 'kiosk'
      },
      {
        model: Merchant,
        as: 'merchant'
      },
      {
        model: CollectionPeriod,
        as: 'period'
      },
      {
        model: PaymentTransaction,
        as: 'payments',
        include: [
          {
            model: User,
            as: 'collector',
            attributes: ['user_id', 'hoTen']
          }
        ]
      }
    ]
  });

  if (!charge) {
    return next(new AppError('Không tìm thấy khoản thu', 404));
  }

  successResponse(res, { charge }, 'Lấy thông tin khoản thu thành công');
});

// Cập nhật trạng thái nợ
// PATCH /api/charges/:id/status
const updateChargeStatus = catchAsync(async (req, res, next) => {
  const { trangThai, lyDo } = req.body;

  const charge = await Charge.findOne({
    where: {
      charge_id: req.params.id,
      tenant_id: req.user.tenant_id
    }
  });

  if (!charge) {
    return next(new AppError('Không tìm thấy khoản thu', 404));
  }

  const oldData = charge.toJSON();
  
  // Increment version
  await charge.update({
    trangThai,
    version: charge.version + 1
  });

  // Audit log
  await AuditLog.create({
    tenant_id: req.user.tenant_id,
    user_id: req.user.user_id,
    hanhDong: 'UPDATE_CHARGE_STATUS',
    entity_type: 'charge',
    entity_id: charge.charge_id,
    giaTriCu: oldData,
    giaTriMoi: charge.toJSON(),
    ghiChu: lyDo
  });

  successResponse(res, { charge }, 'Cập nhật trạng thái thành công');
});

// Lịch sử công nợ và thanh toán
// GET /api/charges/:id/history
const getChargeHistory = catchAsync(async (req, res, next) => {
  const charge = await Charge.findOne({
    where: {
      charge_id: req.params.id,
      tenant_id: req.user.tenant_id
    }
  });

  if (!charge) {
    return next(new AppError('Không tìm thấy khoản thu', 404));
  }

  // Get receipts for this charge
  const receiptCharges = await ReceiptCharge.findAll({
    where: {
      charge_id: charge.charge_id,
      tenant_id: req.user.tenant_id
    },
    include: [
      {
        model: Receipt,
        as: 'receipt',
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['user_id', 'hoTen']
          }
        ]
      }
    ],
    order: [['created_at', 'DESC']]
  });

  // Get audit logs for this charge
  const auditLogs = await AuditLog.findAll({
    where: {
      tenant_id: req.user.tenant_id,
      entity_type: 'charge',
      entity_id: charge.charge_id
    },
    order: [['thoiGianThucHien', 'DESC']]
  });

  successResponse(res, {
    charge,
    paymentHistory: receiptCharges,
    statusHistory: auditLogs
  }, 'Lấy lịch sử công nợ thành công');
});

module.exports = {
  getCharges,
  getChargeById,
  updateChargeStatus,
  getChargeHistory
};

