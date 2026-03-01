const { shift, payment, user, auditlog } = require('../models');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');
const { successResponse, paginationResponse } = require('../utils/responseHandler');
const { sequelize } = require('../config/database');

// Bắt đầu ca thu
// POST /api/shifts/start
const startShift = catchAsync(async (req, res, next) => {
  // Check if user already has active shift
  const activeShift = await shift.findOne({
    where: {
      user_id: req.user.user_id,
      thoiGianKetThucCa: null
    }
  });

  if (activeShift) {
    return next(new AppError('Bạn đã có ca thu đang hoạt động', 400));
  }

  const shift = await Shift.create({
    user_id: req.user.user_id,
    tenant_id: req.user.tenant_id
  });

  successResponse(res, shift, 'Bắt đầu ca thu thành công', 201);
});

// Kết thúc ca thu
// POST /api/shifts/:id/end
const endShift = catchAsync(async (req, res, next) => {
  const shift = await Shift.findOne({
    where: {
      shift_id: req.params.id,
      user_id: req.user.user_id,
      thoiGianKetThucCa: null
    }
  });

  if (!shift) {
    return next(new AppError('Không tìm thấy ca thu hoặc ca đã kết thúc', 404));
  }

  // Get transactions for this shift
  const transactions = await PaymentTransaction.findAll({
    where: { shift_id: shift.shift_id }
  });

  const tongTienMat = transactions
    .filter(t => t.hinhThucThu === 'tien_mat')
    .reduce((sum, t) => sum + parseFloat(t.soTien), 0);

  const tongChuyenKhoan = transactions
    .filter(t => t.hinhThucThu === 'chuyen_khoan')
    .reduce((sum, t) => sum + parseFloat(t.soTien), 0);

  await shift.update({
    thoiGianKetThucCa: new Date(),
    tongTienMatThuDuoc: tongTienMat,
    tongChuyenKhoanThuDuoc: tongChuyenKhoan
  });

  successResponse(res, {
    shift,
    summary: {
      totalTransactions: transactions.length,
      cash: tongTienMat,
      bankTransfer: tongChuyenKhoan,
      total: tongTienMat + tongChuyenKhoan
    }
  }, 'Kết thúc ca thu thành công');
});

// Đối soát ca thu
// POST /api/shifts/:id/reconcile
const reconcileShift = catchAsync(async (req, res, next) => {
  const { thucTeTienMat, thucTeChuyenKhoan, ghiChu } = req.body;

  const shift = await Shift.findOne({
    where: {
      shift_id: req.params.id,
      tenant_id: req.user.tenant_id
    }
  });

  if (!shift) {
    return next(new AppError('Không tìm thấy ca thu', 404));
  }

  if (shift.trangThaiDoiSoat !== 'chua_doi_soat') {
    return next(new AppError('Ca thu đã được đối soát', 400));
  }

  const chenhLechTienMat = thucTeTienMat - parseFloat(shift.tongTienMatThuDuoc);
  const chenhLechChuyenKhoan = thucTeChuyenKhoan - parseFloat(shift.tongChuyenKhoanThuDuoc);

  let trangThaiDoiSoat = 'da_doi_soat';
  if (chenhLechTienMat !== 0 || chenhLechChuyenKhoan !== 0) {
    trangThaiDoiSoat = 'co_sai_lech';
  }

  await shift.update({
    trangThaiDoiSoat,
    ghiChuDoiSoat: ghiChu || `Chênh lệch: TM ${chenhLechTienMat}, CK ${chenhLechChuyenKhoan}`
  });

  // Create audit log
  await AuditLog.create({
    user_id: req.user.user_id,
    hanhDong: 'RECONCILE_SHIFT',
    entity_type: 'SHIFT',
    entity_id: shift.shift_id,
    giaTriMoi: {
      thucTeTienMat,
      thucTeChuyenKhoan,
      chenhLechTienMat,
      chenhLechChuyenKhoan
    },
    tenant_id: req.user.tenant_id,
    ip_address: req.ip,
    user_agent: req.headers['user-agent']
  });

  successResponse(res, {
    shift,
    reconciliation: {
      chenhLechTienMat,
      chenhLechChuyenKhoan
    }
  }, 'Đối soát ca thu thành công');
});

// Lấy danh sách ca thu
// GET /api/shifts
const getShifts = catchAsync(async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;

  const where = { tenant_id: req.user.tenant_id };

  if (req.query.user_id) {
    where.user_id = req.query.user_id;
  }
  if (req.query.trangThaiDoiSoat) {
    where.trangThaiDoiSoat = req.query.trangThaiDoiSoat;
  }

  const { count, rows } = await Shift.findAndCountAll({
    where,
    include: [
      {
        model: User,
        as: 'user',
        attributes: ['user_id', 'hoTen']
      }
    ],
    limit,
    offset,
    order: [['created_at', 'DESC']]
  });

  paginationResponse(res, rows, count, page, limit, 'Lấy danh sách ca thu thành công');
});

// Lấy chi tiết ca thu
// GET /api/shifts/:id
const getShiftById = catchAsync(async (req, res, next) => {
  const shift = await Shift.findOne({
    where: {
      shift_id: req.params.id,
      tenant_id: req.user.tenant_id
    },
    include: [
      {
        model: User,
        as: 'user',
        attributes: ['user_id', 'hoTen']
      },
      {
        model: PaymentTransaction,
        as: 'transactions',
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
          }
        ]
      }
    ]
  });

  if (!shift) {
    return next(new AppError('Không tìm thấy ca thu', 404));
  }

  successResponse(res, { shift }, 'Lấy thông tin ca thu thành công');
});

module.exports = {
  startShift,
  endShift,
  reconcileShift,
  getShifts,
  getShiftById
};
