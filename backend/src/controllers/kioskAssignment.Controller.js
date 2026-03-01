const { KioskAssignment, Kiosk, Merchant, AuditLog } = require('../models');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');
const { successResponse, paginationResponse } = require('../utils/responseHandler');
const { sequelize } = require('../config/database');

// Kết thúc thuê kiosk
// /api/kiosk_assignments/{id}/end
const endKioskAssignment = catchAsync(async (req, res, next) => {
  const assignment = await KioskAssignment.findOne({
    where: {
      assignment_id: req.params.id,
      tenant_id: req.user.tenant_id,
      trangThai: 'dang_thue'
    },
    include: [
      {
        model: Kiosk,
        as: 'kiosk'
      }
    ]
  });

  if (!assignment) {
    return next(new AppError('Không tìm thấy hợp đồng thuê đang hoạt động', 404));
  }

  // Check if there are pending charges
  const pendingCharges = await Charge.count({
    where: {
      kiosk_id: assignment.kiosk_id,
      merchant_id: assignment.merchant_id,
      trangThai: ['chua_thu', 'da_thu_mot_phan']
    }
  });

  if (pendingCharges > 0) {
    return next(new AppError('Tiểu thương còn khoản phí chưa thanh toán, không thể kết thúc hợp đồng', 400));
  }

  // Use transaction
  const result = await sequelize.transaction(async (t) => {
    // Update assignment
    await assignment.update({
      ngayKetThuc: new Date(),
      trangThai: 'da_ket_thuc'
    }, { transaction: t });

    // Update kiosk status
    await assignment.kiosk.update({ trangThai: 'trong' }, { transaction: t });

    return assignment;
  });

  // Create audit log
  await AuditLog.create({
    user_id: req.user.user_id,
    hanhDong: 'END_KIOSK_ASSIGNMENT',
    entity_type: 'KIOSK_ASSIGNMENT',
    entity_id: assignment.assignment_id,
    giaTriMoi: { ngayKetThuc: new Date(), trangThai: 'da_ket_thuc' },
    tenant_id: req.user.tenant_id,
    ip_address: req.ip,
    user_agent: req.headers['user-agent']
  });

  successResponse(res, { assignment: result }, 'Kết thúc thuê kiosk thành công');
});

module.exports = {
  endKioskAssignment
};