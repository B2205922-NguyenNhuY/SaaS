const { PaymentTransaction, Charge, Shift, Kiosk, Merchant, AuditLog } = require('../models');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');
const { successResponse, paginationResponse } = require('../utils/responseHandler');
const { uploadToCloudinary } = require('../middleware/upload.middleware');
const { sequelize, sqliteConnection } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

// Tạo giao dịch thu phí
// POST /api/payments
const createPayment = catchAsync(async (req, res, next) => {
  const {
    charge_id,
    soTien,
    hinhThucThu,
    ghiChu,
    shift_id,
    is_offline
  } = req.body;

  // Find charge
  const charge = await Charge.findOne({
    where: {
      charge_id,
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
      }
    ]
  });

  if (!charge) {
    return next(new AppError('Không tìm thấy khoản phí', 404));
  }

  // Check if payment amount is valid
  if (soTien > charge.soTienConNo) {
    return next(new AppError('Số tiền thu không được lớn hơn số tiền còn nợ', 400));
  }

  // Handle receipt image upload
  let anhChupChungTu = null;
  if (req.file) {
    const result = await uploadToCloudinary(req.file, 'receipts');
    anhChupChungTu = result.secure_url;
  }

  // For offline mode, save to SQLite first
  if (is_offline) {
    const offlineId = uuidv4();
    
    sqliteConnection.run(
      `INSERT INTO offline_transactions 
       (transaction_id, kiosk_id, amount, payment_method, image_url, notes, collector_id) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [offlineId, charge.kiosk_id, soTien, hinhThucThu, anhChupChungTu, ghiChu, req.user.user_id],
      function(err) {
        if (err) {
          return next(new AppError('Lỗi lưu offline: ' + err.message, 500));
        }
        
        return successResponse(res, {
          offline_id: offlineId,
          message: 'Giao dịch đã được lưu offline'
        }, 'Lưu giao dịch offline thành công');
      }
    );
    return;
  }

  // Online mode - process payment
  const result = await sequelize.transaction(async (t) => {
    // Create payment transaction
    const transaction = await PaymentTransaction.create({
      charge_id,
      user_id: req.user.user_id,
      soTien,
      hinhThucThu,
      ghiChu,
      anhChupChungTu,
      shift_id,
      tenant_id: req.user.tenant_id
    }, { transaction: t });

    // Update charge
    const soTienDaThu = parseFloat(charge.soTienDaThu) + parseFloat(soTien);
    const soTienConNo = parseFloat(charge.soTien) - soTienDaThu;
    
    let trangThai = charge.trangThai;
    if (soTienConNo === 0) {
      trangThai = 'da_thu';
    } else if (soTienDaThu > 0) {
      trangThai = 'da_thu_mot_phan';
    }

    await charge.update({
      soTienDaThu,
      soTienConNo,
      trangThai
    }, { transaction: t });

    // Update shift if exists
    if (shift_id) {
      const shift = await Shift.findByPk(shift_id, { transaction: t });
      if (shift) {
        if (hinhThucThu === 'tien_mat') {
          await shift.update({
            tongTienMatThuDuoc: parseFloat(shift.tongTienMatThuDuoc) + parseFloat(soTien)
          }, { transaction: t });
        } else {
          await shift.update({
            tongChuyenKhoanThuDuoc: parseFloat(shift.tongChuyenKhoanThuDuoc) + parseFloat(soTien)
          }, { transaction: t });
        }
      }
    }

    return transaction;
  });

  // Create audit log
  await AuditLog.create({
    user_id: req.user.user_id,
    hanhDong: 'CREATE_PAYMENT',
    entity_type: 'PAYMENT_TRANSACTION',
    entity_id: result.transaction_id,
    giaTriMoi: result.toJSON(),
    tenant_id: req.user.tenant_id,
    ip_address: req.ip,
    user_agent: req.headers['user-agent']
  });

  successResponse(res, result, 'Tạo giao dịch thành công', 201);
});

// Đồng bộ giao dịch offline
// POST /api/payments/sync-offline
const syncOfflinePayments = catchAsync(async (req, res, next) => {
  const { transactions } = req.body;

  const results = {
    success: [],
    failed: []
  };

  for (const offlineTx of transactions) {
    try {
      await sequelize.transaction(async (t) => {
        // Find charge by kiosk_id and date
        const charge = await Charge.findOne({
          where: {
            kiosk_id: offlineTx.kiosk_id,
            tenant_id: req.user.tenant_id,
            trangThai: ['chua_thu', 'da_thu_mot_phan']
          },
          order: [['created_at', 'DESC']],
          transaction: t
        });

        if (!charge) {
          throw new Error('Không tìm thấy khoản phí phù hợp');
        }

        // Create transaction
        const transaction = await PaymentTransaction.create({
          charge_id: charge.charge_id,
          user_id: req.user.user_id,
          soTien: offlineTx.amount,
          hinhThucThu: offlineTx.payment_method,
          ghiChu: offlineTx.notes,
          anhChupChungTu: offlineTx.image_url,
          tenant_id: req.user.tenant_id
        }, { transaction: t });

        // Update charge
        const soTienDaThu = parseFloat(charge.soTienDaThu) + parseFloat(offlineTx.amount);
        const soTienConNo = parseFloat(charge.soTien) - soTienDaThu;
        
        await charge.update({
          soTienDaThu,
          soTienConNo,
          trangThai: soTienConNo === 0 ? 'da_thu' : 'da_thu_mot_phan'
        }, { transaction: t });

        results.success.push({
          offline_id: offlineTx.id,
          transaction_id: transaction.transaction_id
        });
      });
    } catch (error) {
      results.failed.push({
        offline_id: offlineTx.id,
        error: error.message
      });
    }
  }

  // Delete synced transactions from SQLite
  if (results.success.length > 0) {
    const placeholders = results.success.map(() => '?').join(',');
    const ids = results.success.map(s => s.offline_id);
    
    sqliteConnection.run(
      `DELETE FROM offline_transactions WHERE id IN (${placeholders})`,
      ids
    );
  }

  successResponse(res, results, 'Đồng bộ hoàn tất');
});

// Lấy danh sách giao dịch
// GET /api/payments
const getPayments = catchAsync(async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;

  const where = { tenant_id: req.user.tenant_id };

  if (req.query.charge_id) {
    where.charge_id = req.query.charge_id;
  }
  if (req.query.user_id) {
    where.user_id = req.query.user_id;
  }
  if (req.query.hinhThucThu) {
    where.hinhThucThu = req.query.hinhThucThu;
  }

  const { count, rows } = await PaymentTransaction.findAndCountAll({
    where,
    include: [
      {
        model: Charge,
        as: 'charge',
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
      },
      {
        model: User,
        as: 'collector',
        attributes: ['user_id', 'hoTen']
      }
    ],
    limit,
    offset,
    order: [['created_at', 'DESC']]
  });

  paginationResponse(res, rows, count, page, limit, 'Lấy danh sách giao dịch thành công');
});

// Lấy chi tiết giao dịch
// GET /api/payments/:id
const getPaymentById = catchAsync(async (req, res, next) => {
  const payment = await PaymentTransaction.findOne({
    where: {
      transaction_id: req.params.id,
      tenant_id: req.user.tenant_id
    },
    include: [
      {
        model: Charge,
        as: 'charge',
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
      },
      {
        model: User,
        as: 'collector',
        attributes: ['user_id', 'hoTen']
      }
    ]
  });

  if (!payment) {
    return next(new AppError('Không tìm thấy giao dịch', 404));
  }

  successResponse(res, { payment }, 'Lấy thông tin giao dịch thành công');
});

module.exports = {
  createPayment,
  syncOfflinePayments,
  getPayments,
  getPaymentById
};