const { KioskType, Kiosk, AuditLog } = require('../models');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');
const { successResponse, paginationResponse } = require('../utils/responseHandler');

// Tạo loại kiosk mới
// POST /api/kiosk_types
const createKioskType = catchAsync(async (req, res, next) => {
  const { tenLoai, moTa } = req.body;

  const kioskType = await KioskType.create({
    tenLoai,
    moTa,
    tenant_id: req.user.tenant_id
  });

  // Create audit log
  await AuditLog.create({
    user_id: req.user.user_id,
    hanhDong: 'CREATE_KIOSK_TYPE',
    entity_type: 'KIOSK_TYPE',
    entity_id: kioskType.type_id,
    giaTriMoi: kioskType.toJSON(),
    tenant_id: req.user.tenant_id,
    ip_address: req.ip,
    user_agent: req.headers['user-agent']
  });

  successResponse(res, kioskType, 'Tạo loại kiosk thành công', 201);
});

// Lấy danh sách loại kiosk
// GET /api/kiosk_types
const getKioskTypes = catchAsync(async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;

  const where = { tenant_id: req.user.tenant_id };

  const { count, rows } = await KioskType.findAndCountAll({
    where,
    limit,
    offset,
    order: [['created_at', 'DESC']]
  });

  paginationResponse(res, rows, count, page, limit, 'Lấy danh sách loại kiosk thành công');
});

// Lấy chi tiết loại kiosk
// GET /api/kiosk_types/:id
const getKioskTypeById = catchAsync(async (req, res, next) => {
  const kioskType = await KioskType.findOne({
    where: {
      type_id: req.params.id,
      tenant_id: req.user.tenant_id
    },
    include: [
      {
        model: Kiosk,
        as: 'kiosks',
        limit: 10
      }
    ]
  });

  if (!kioskType) {
    return next(new AppError('Không tìm thấy loại kiosk', 404));
  }

  successResponse(res, { kioskType }, 'Lấy thông tin loại kiosk thành công');
});

// Cập nhật loại kiosk
// PUT /api/kiosk_types/:id
const updateKioskType = catchAsync(async (req, res, next) => {
  const kioskType = await KioskType.findOne({
    where: {
      type_id: req.params.id,
      tenant_id: req.user.tenant_id
    }
  });

  if (!kioskType) {
    return next(new AppError('Không tìm thấy loại kiosk', 404));
  }

  const oldData = kioskType.toJSON();
  await kioskType.update(req.body);

  // Create audit log
  await AuditLog.create({
    user_id: req.user.user_id,
    hanhDong: 'UPDATE_KIOSK_TYPE',
    entity_type: 'KIOSK_TYPE',
    entity_id: kioskType.type_id,
    giaTriCu: oldData,
    giaTriMoi: kioskType.toJSON(),
    tenant_id: req.user.tenant_id,
    ip_address: req.ip,
    user_agent: req.headers['user-agent']
  });

  successResponse(res, { kioskType }, 'Cập nhật loại kiosk thành công');
});

// Xóa loại kiosk
// DELETE /api/kiosk_types/:id
const deleteKioskType = catchAsync(async (req, res, next) => {
  const kioskType = await KioskType.findOne({
    where: {
      type_id: req.params.id,
      tenant_id: req.user.tenant_id
    }
  });

  if (!kioskType) {
    return next(new AppError('Không tìm thấy loại kiosk', 404));
  }

  // Check if type has kiosks
  const kioskCount = await Kiosk.count({
    where: { type_id: kioskType.type_id }
  });

  if (kioskCount > 0) {
    return next(new AppError('Không thể xóa loại kiosk đang được sử dụng', 400));
  }

  await kioskType.destroy();

  // Create audit log
  await AuditLog.create({
    user_id: req.user.user_id,
    hanhDong: 'DELETE_KIOSK_TYPE',
    entity_type: 'KIOSK_TYPE',
    entity_id: kioskType.type_id,
    tenant_id: req.user.tenant_id,
    ip_address: req.ip,
    user_agent: req.headers['user-agent']
  });

  successResponse(res, null, 'Xóa loại kiosk thành công');
});

module.exports = {
  createKioskType,
  getKioskTypes,
  getKioskTypeById,
  updateKioskType,
  deleteKioskType
};