const jwt = require('jsonwebtoken');
const { User } = require('../models');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');

const protect = catchAsync(async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next(new AppError('Bạn chưa đăng nhập', 401));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findOne({
      where: {
        user_id: decoded.user_id,
        tenant_id: decoded.tenant_id,
        trangThai: 'active'
      }
    });

    if (!user) {
      return next(new AppError('Người dùng không tồn tại hoặc đã bị khóa', 401));
    }

    req.user = user;
    req.tenant_id = user.tenant_id;
    next();
  } catch (error) {
    return next(new AppError('Token không hợp lệ', 401));
  }
});

const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role_id)) {
      return next(new AppError('Bạn không có quyền thực hiện hành động này', 403));
    }
    next();
  };
};

const checkSuperAdmin = catchAsync(async (req, res, next) => {
  const token = req.headers.authorization.split(' ')[1];
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  
  if (!decoded.isSuperAdmin) {
    return next(new AppError('Yêu cầu quyền Super Admin', 403));
  }
  
  req.super_admin_id = decoded.admin_id;
  next();
});

module.exports = { protect, restrictTo, checkSuperAdmin };