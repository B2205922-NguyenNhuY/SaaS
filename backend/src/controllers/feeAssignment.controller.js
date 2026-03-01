const { FeeSchedule, Kiosk, Zone, KioskType, AuditLog } = require('../models');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');
const { successResponse } = require('../utils/responseHandler');

// Áp dụng biểu phí cho kiosk/khu
// POST /api/fees_assignment
const applyFeeToTarget = catchAsync(async (req, res, next) => {
  const { fee_id, target_type, target_ids } = req.body;

  // Find fee schedule
  const feeSchedule = await FeeSchedule.findOne({
    where: {
      fee_id,
      tenant_id: req.user.tenant_id,
      trangThai: 'ap_dung'
    }
  });

  if (!feeSchedule) {
    return next(new AppError('Không tìm thấy biểu phí hoặc biểu phí không ở trạng thái áp dụng', 404));
  }

  const results = {
    success: [],
    failed: []
  };

  // Apply fee to each target
  for (const target_id of target_ids) {
    try {
      // Validate target exists
      if (target_type === 'kiosk') {
        const kiosk = await Kiosk.findOne({
          where: {
            kiosk_id: target_id,
            tenant_id: req.user.tenant_id
          }
        });
        if (!kiosk) {
          results.failed.push({ target_id, reason: 'Kiosk không tồn tại' });
          continue;
        }
      } else if (target_type === 'khu') {
        const zone = await Zone.findOne({
          where: {
            zone_id: target_id,
            tenant_id: req.user.tenant_id
          }
        });
        if (!zone) {
          results.failed.push({ target_id, reason: 'Khu không tồn tại' });
          continue;
        }
      } else if (target_type === 'loai_kiosk') {
        const kioskType = await KioskType.findOne({
          where: {
            type_id: target_id,
            tenant_id: req.user.tenant_id
          }
        });
        if (!kioskType) {
          results.failed.push({ target_id, reason: 'Loại kiosk không tồn tại' });
          continue;
        }
      }

      // Deactivate old fee for this target
      await FeeSchedule.update(
        { trangThai: 'ngung_ap_dung', ngayKetThuc: new Date() },
        {
          where: {
            target_type,
            target_id,
            tenant_id: req.user.tenant_id,
            trangThai: 'ap_dung'
          }
        }
      );

      // Create new fee assignment (clone fee schedule)
      const newAssignment = await FeeSchedule.create({
        tenBieuPhi: feeSchedule.tenBieuPhi,
        target_type,
        target_id,
        hinhThucThu: feeSchedule.hinhThucThu,
        donGia: feeSchedule.donGia,
        mucMienGiam: feeSchedule.mucMienGiam,
        ngayApDung: new Date(),
        tenant_id: req.user.tenant_id,
        trangThai: 'ap_dung'
      });

      results.success.push({
        target_id,
        assignment_id: newAssignment.fee_id
      });

    } catch (error) {
      results.failed.push({ target_id, reason: error.message });
    }
  }

  // Create audit log
  await AuditLog.create({
    user_id: req.user.user_id,
    hanhDong: 'APPLY_FEE',
    entity_type: 'FEE_ASSIGNMENT',
    entity_id: fee_id,
    giaTriMoi: { target_type, target_ids, results },
    tenant_id: req.user.tenant_id,
    ip_address: req.ip,
    user_agent: req.headers['user-agent']
  });

  successResponse(res, { results }, 'Áp dụng biểu phí hoàn tất');
});

module.exports = {
  applyFeeToTarget
};