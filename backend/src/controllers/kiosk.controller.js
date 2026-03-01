const { Kiosk, Market, Zone, KioskType, KioskAssignment, AuditLog } = require('../models');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');
const { successResponse, paginationResponse } = require('../utils/responseHandler');
const { uploadToCloudinary } = require('../middleware/upload.middleware');

// Tạo kiosk mới
// POST /api/kiosks
const createKiosk = catchAsync(async (req, res, next) => {
  const {
    maKiosk,
    viTriChiTiet,
    dienTich,
    moTa,
    type_id,
    zone_id,
    market_id
  } = req.body;

  // Check if market exists and belongs to tenant
  const market = await Market.findOne({
    where: {
      market_id,
      tenant_id: req.user.tenant_id
    }
  });

  if (!market) {
    return next(new AppError('Không tìm thấy chợ', 404));
  }

  // Check if kiosk code already exists in this market
  const existingKiosk = await Kiosk.findOne({
    where: {
      maKiosk,
      market_id
    }
  });

  if (existingKiosk) {
    return next(new AppError('Mã kiosk đã tồn tại trong chợ này', 400));
  }

  // Handle image uploads if any
  let hinhAnh = [];
  if (req.files && req.files.length > 0) {
    for (const file of req.files) {
      const result = await uploadToCloudinary(file, 'kiosks');
      hinhAnh.push(result.secure_url);
    }
  }

  const kiosk = await Kiosk.create({
    maKiosk,
    viTriChiTiet,
    dienTich,
    moTa,
    type_id,
    zone_id,
    market_id,
    tenant_id: req.user.tenant_id,
    hinhAnh: hinhAnh.length > 0 ? hinhAnh : null
  });

  // Create audit log
  await AuditLog.create({
    user_id: req.user.user_id,
    hanhDong: 'CREATE_KIOSK',
    entity_type: 'KIOSK',
    entity_id: kiosk.kiosk_id,
    giaTriMoi: kiosk.toJSON(),
    tenant_id: req.user.tenant_id,
    ip_address: req.ip,
    user_agent: req.headers['user-agent']
  });

  successResponse(res, kiosk, 'Tạo kiosk thành công', 201);
});

// Lấy danh sách kiosk
// GET /api/kiosks
const getKiosks = catchAsync(async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const offset = (page - 1) * limit;

  const where = { tenant_id: req.user.tenant_id };

  // Filters
  if (req.query.market_id) {
    where.market_id = req.query.market_id;
  }
  if (req.query.zone_id) {
    where.zone_id = req.query.zone_id;
  }
  if (req.query.type_id) {
    where.type_id = req.query.type_id;
  }
  if (req.query.trangThai) {
    where.trangThai = req.query.trangThai;
  }

  const { count, rows } = await Kiosk.findAndCountAll({
    where,
    include: [
      {
        model: Market,
        as: 'market',
        attributes: ['market_id', 'tenChu']
      },
      {
        model: Zone,
        as: 'zone',
        attributes: ['zone_id', 'tenZone']
      },
      {
        model: KioskType,
        as: 'type',
        attributes: ['type_id', 'tenLoai']
      }
    ],
    limit,
    offset,
    order: [['created_at', 'DESC']]
  });

  paginationResponse(res, rows, count, page, limit, 'Lấy danh sách kiosk thành công');
});

// Lấy chi tiết kiosk
// GET /api/kiosks/:id
const getKioskById = catchAsync(async (req, res, next) => {
  const kiosk = await Kiosk.findOne({
    where: {
      kiosk_id: req.params.id,
      tenant_id: req.user.tenant_id
    },
    include: [
      {
        model: Market,
        as: 'market'
      },
      {
        model: Zone,
        as: 'zone'
      },
      {
        model: KioskType,
        as: 'type'
      },
      {
        model: KioskAssignment,
        as: 'assignments',
        where: { trangThai: 'dang_thue' },
        required: false
      }
    ]
  });

  if (!kiosk) {
    return next(new AppError('Không tìm thấy kiosk', 404));
  }

  successResponse(res, { kiosk }, 'Lấy thông tin kiosk thành công');
});

// Cập nhật kiosk
// PUT /api/kiosks/:id
const updateKiosk = catchAsync(async (req, res, next) => {
  const kiosk = await Kiosk.findOne({
    where: {
      kiosk_id: req.params.id,
      tenant_id: req.user.tenant_id
    }
  });

  if (!kiosk) {
    return next(new AppError('Không tìm thấy kiosk', 404));
  }

  const oldData = kiosk.toJSON();

  // Handle image uploads if any
  let hinhAnh = kiosk.hinhAnh || [];
  if (req.files && req.files.length > 0) {
    for (const file of req.files) {
      const result = await uploadToCloudinary(file, 'kiosks');
      hinhAnh.push(result.secure_url);
    }
  }

  const updateData = {
    ...req.body,
    hinhAnh: hinhAnh.length > 0 ? hinhAnh : null
  };

  await kiosk.update(updateData);

  // Create audit log
  await AuditLog.create({
    user_id: req.user.user_id,
    hanhDong: 'UPDATE_KIOSK',
    entity_type: 'KIOSK',
    entity_id: kiosk.kiosk_id,
    giaTriCu: oldData,
    giaTriMoi: kiosk.toJSON(),
    tenant_id: req.user.tenant_id,
    ip_address: req.ip,
    user_agent: req.headers['user-agent']
  });

  successResponse(res, { kiosk }, 'Cập nhật kiosk thành công');
});

// Cập nhật trạng thái kiosk
// PATCH /api/kiosks/:id/status
const updateKioskStatus = catchAsync(async (req, res, next) => {
  const { trangThai } = req.body;

  const kiosk = await Kiosk.findOne({
    where: {
      kiosk_id: req.params.id,
      tenant_id: req.user.tenant_id
    }
  });

  if (!kiosk) {
    return next(new AppError('Không tìm thấy kiosk', 404));
  }

  const oldStatus = kiosk.trangThai;
  await kiosk.update({ trangThai });

  // Create audit log
  await AuditLog.create({
    user_id: req.user.user_id,
    hanhDong: 'UPDATE_KIOSK_STATUS',
    entity_type: 'KIOSK',
    entity_id: kiosk.kiosk_id,
    giaTriCu: { trangThai: oldStatus },
    giaTriMoi: { trangThai },
    tenant_id: req.user.tenant_id,
    ip_address: req.ip,
    user_agent: req.headers['user-agent']
  });

  successResponse(res, { kiosk }, 'Cập nhật trạng thái kiosk thành công');
});

// Upload hình ảnh kiosk
// POST /api/kiosks/:id/images
const uploadKioskImages = catchAsync(async (req, res, next) => {
  const kiosk = await Kiosk.findOne({
    where: {
      kiosk_id: req.params.id,
      tenant_id: req.user.tenant_id
    }
  });

  if (!kiosk) {
    return next(new AppError('Không tìm thấy kiosk', 404));
  }

  if (!req.files || req.files.length === 0) {
    return next(new AppError('Vui lòng chọn file để upload', 400));
  }

  const hinhAnh = kiosk.hinhAnh || [];

  for (const file of req.files) {
    const result = await uploadToCloudinary(file, 'kiosks');
    hinhAnh.push(result.secure_url);
  }

  await kiosk.update({ hinhAnh });

  successResponse(res, { hinhAnh }, 'Upload hình ảnh thành công');
});

// Xóa hình ảnh kiosk
// DELETE /api/kiosks/:id/images/:index
const deleteKioskImage = catchAsync(async (req, res, next) => {
  const kiosk = await Kiosk.findOne({
    where: {
      kiosk_id: req.params.id,
      tenant_id: req.user.tenant_id
    }
  });

  if (!kiosk) {
    return next(new AppError('Không tìm thấy kiosk', 404));
  }

  const hinhAnh = kiosk.hinhAnh || [];
  const index = parseInt(req.params.index);

  if (index < 0 || index >= hinhAnh.length) {
    return next(new AppError('Không tìm thấy hình ảnh', 404));
  }

  hinhAnh.splice(index, 1);
  await kiosk.update({ hinhAnh: hinhAnh.length > 0 ? hinhAnh : null });

  successResponse(res, { hinhAnh }, 'Xóa hình ảnh thành công');
});

module.exports = {
  createKiosk,
  getKiosks,
  getKioskById,
  updateKiosk,
  updateKioskStatus,
  uploadKioskImages,
  deleteKioskImage
};