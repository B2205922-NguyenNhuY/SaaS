const { Zone, Market, Kiosk, AuditLog } = require('../models');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');
const { successResponse, paginationResponse } = require('../utils/responseHandler');

// Tạo khu mới
// POST /api/zones
const createZone = catchAsync(async (req, res, next) => {
  const { tenZone, moTa, market_id } = req.body;

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

  const zone = await Zone.create({
    tenZone,
    moTa,
    market_id,
    tenant_id: req.user.tenant_id
  });

  // Create audit log
  await AuditLog.create({
    user_id: req.user.user_id,
    hanhDong: 'CREATE_ZONE',
    entity_type: 'ZONE',
    entity_id: zone.zone_id,
    giaTriMoi: zone.toJSON(),
    tenant_id: req.user.tenant_id,
    ip_address: req.ip,
    user_agent: req.headers['user-agent']
  });

  successResponse(res, zone, 'Tạo khu thành công', 201);
});

// Lấy danh sách khu
// GET /api/zones
const getZones = catchAsync(async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;

  const where = { tenant_id: req.user.tenant_id };

  if (req.query.market_id) {
    where.market_id = req.query.market_id;
  }

  const { count, rows } = await Zone.findAndCountAll({
    where,
    include: [
      {
        model: Market,
        as: 'market',
        attributes: ['market_id', 'tenChu']
      }
    ],
    limit,
    offset,
    order: [['created_at', 'DESC']]
  });

  paginationResponse(res, rows, count, page, limit, 'Lấy danh sách khu thành công');
});

// Lấy chi tiết khu
// GET /api/zones/:id
const getZoneById = catchAsync(async (req, res, next) => {
  const zone = await Zone.findOne({
    where: {
      zone_id: req.params.id,
      tenant_id: req.user.tenant_id
    },
    include: [
      {
        model: Market,
        as: 'market'
      },
      {
        model: Kiosk,
        as: 'kiosks',
        limit: 10
      }
    ]
  });

  if (!zone) {
    return next(new AppError('Không tìm thấy khu', 404));
  }

  successResponse(res, { zone }, 'Lấy thông tin khu thành công');
});

// Cập nhật khu
// PUT /api/zones/:id
const updateZone = catchAsync(async (req, res, next) => {
  const zone = await Zone.findOne({
    where: {
      zone_id: req.params.id,
      tenant_id: req.user.tenant_id
    }
  });

  if (!zone) {
    return next(new AppError('Không tìm thấy khu', 404));
  }

  const oldData = zone.toJSON();
  await zone.update(req.body);

  // Create audit log
  await AuditLog.create({
    user_id: req.user.user_id,
    hanhDong: 'UPDATE_ZONE',
    entity_type: 'ZONE',
    entity_id: zone.zone_id,
    giaTriCu: oldData,
    giaTriMoi: zone.toJSON(),
    tenant_id: req.user.tenant_id,
    ip_address: req.ip,
    user_agent: req.headers['user-agent']
  });

  successResponse(res, { zone }, 'Cập nhật khu thành công');
});

// Xóa khu
// DELETE /api/zones/:id
const deleteZone = catchAsync(async (req, res, next) => {
  const zone = await Zone.findOne({
    where: {
      zone_id: req.params.id,
      tenant_id: req.user.tenant_id
    }
  });

  if (!zone) {
    return next(new AppError('Không tìm thấy khu', 404));
  }

  // Check if zone has kiosks
  const kioskCount = await Kiosk.count({
    where: { zone_id: zone.zone_id }
  });

  if (kioskCount > 0) {
    return next(new AppError('Không thể xóa khu đã có kiosk', 400));
  }

  await zone.destroy();

  // Create audit log
  await AuditLog.create({
    user_id: req.user.user_id,
    hanhDong: 'DELETE_ZONE',
    entity_type: 'ZONE',
    entity_id: zone.zone_id,
    tenant_id: req.user.tenant_id,
    ip_address: req.ip,
    user_agent: req.headers['user-agent']
  });

  successResponse(res, null, 'Xóa khu thành công');
});

module.exports = {
  createZone,
  getZones,
  getZoneById,
  updateZone,
  deleteZone
};