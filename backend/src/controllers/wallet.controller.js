const { Wallet, WalletTransaction, Merchant, PaymentTransaction, AuditLog } = require('../models');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');
const { successResponse, paginationResponse } = require('../utils/responseHandler');
const { sequelize } = require('../config/database');

// Lấy thông tin ví của tiểu thương
// GET /api/wallets/merchant/:merchantId
const getMerchantWallet = catchAsync(async (req, res, next) => {
  const wallet = await Wallet.findOne({
    where: {
      merchant_id: req.params.merchantId,
      tenant_id: req.user.tenant_id
    },
    include: [
      {
        model: Merchant,
        as: 'merchant'
      }
    ]
  });

  if (!wallet) {
    return next(new AppError('Không tìm thấy ví', 404));
  }

  successResponse(res, { wallet }, 'Lấy thông tin ví thành công');
});

// Nạp tiền vào ví
// POST /api/wallets/:walletId/deposit
const depositToWallet = catchAsync(async (req, res, next) => {
  const { soTien, moTa } = req.body;

  const wallet = await Wallet.findOne({
    where: {
      wallet_id: req.params.walletId,
      tenant_id: req.user.tenant_id
    }
  });

  if (!wallet) {
    return next(new AppError('Không tìm thấy ví', 404));
  }

  if (soTien <= 0) {
    return next(new AppError('Số tiền nạp phải lớn hơn 0', 400));
  }

  // Use transaction
  const result = await sequelize.transaction(async (t) => {
    // Update wallet balance
    const soDuMoi = parseFloat(wallet.soDu) + parseFloat(soTien);
    await wallet.update({ soDu: soDuMoi }, { transaction: t });

    // Create transaction record
    const walletTx = await WalletTransaction.create({
      wallet_id: wallet.wallet_id,
      loai: 'nap',
      soTien,
      soDuSauGiaoDich: soDuMoi,
      moTa,
      tenant_id: req.user.tenant_id
    }, { transaction: t });

    return walletTx;
  });

  // Create audit log
  await AuditLog.create({
    user_id: req.user.user_id,
    hanhDong: 'WALLET_DEPOSIT',
    entity_type: 'WALLET',
    entity_id: wallet.wallet_id,
    giaTriMoi: { soTien, soDuMoi: wallet.soDu },
    tenant_id: req.user.tenant_id,
    ip_address: req.ip,
    user_agent: req.headers['user-agent']
  });

  successResponse(res, {
    transaction: result,
    newBalance: wallet.soDu
  }, 'Nạp tiền vào ví thành công');
});

// Thanh toán bằng ví
// POST /api/wallets/:walletId/pay
const payWithWallet = catchAsync(async (req, res, next) => {
  const { soTien, charge_id, moTa } = req.body;

  const wallet = await Wallet.findOne({
    where: {
      wallet_id: req.params.walletId,
      tenant_id: req.user.tenant_id
    }
  });

  if (!wallet) {
    return next(new AppError('Không tìm thấy ví', 404));
  }

  if (soTien <= 0) {
    return next(new AppError('Số tiền thanh toán phải lớn hơn 0', 400));
  }

  if (parseFloat(wallet.soDu) < parseFloat(soTien)) {
    return next(new AppError('Số dư không đủ', 400));
  }

  // Find charge
  const charge = await Charge.findOne({
    where: {
      charge_id,
      tenant_id: req.user.tenant_id
    }
  });

  if (!charge) {
    return next(new AppError('Không tìm thấy khoản phí', 404));
  }

  // Use transaction
  const result = await sequelize.transaction(async (t) => {
    // Update wallet balance
    const soDuMoi = parseFloat(wallet.soDu) - parseFloat(soTien);
    await wallet.update({ soDu: soDuMoi }, { transaction: t });

    // Create wallet transaction
    const walletTx = await WalletTransaction.create({
      wallet_id: wallet.wallet_id,
      loai: 'thanh_toan',
      soTien,
      soDuSauGiaoDich: soDuMoi,
      charge_id,
      moTa,
      tenant_id: req.user.tenant_id
    }, { transaction: t });

    // Update charge
    const soTienDaThu = parseFloat(charge.soTienDaThu) + parseFloat(soTien);
    const soTienConNo = parseFloat(charge.soTien) - soTienDaThu;
    
    await charge.update({
      soTienDaThu,
      soTienConNo,
      trangThai: soTienConNo === 0 ? 'da_thu' : 'da_thu_mot_phan'
    }, { transaction: t });

    return walletTx;
  });

  // Create audit log
  await AuditLog.create({
    user_id: req.user.user_id,
    hanhDong: 'WALLET_PAYMENT',
    entity_type: 'WALLET',
    entity_id: wallet.wallet_id,
    giaTriMoi: { soTien, soDuMoi: wallet.soDu, charge_id },
    tenant_id: req.user.tenant_id,
    ip_address: req.ip,
    user_agent: req.headers['user-agent']
  });

  successResponse(res, {
    transaction: result,
    newBalance: wallet.soDu
  }, 'Thanh toán bằng ví thành công');
});

// Lấy lịch sử giao dịch ví
// GET /api/wallets/:walletId/transactions
const getWalletTransactions = catchAsync(async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;

  const wallet = await Wallet.findOne({
    where: {
      wallet_id: req.params.walletId,
      tenant_id: req.user.tenant_id
    }
  });

  if (!wallet) {
    return next(new AppError('Không tìm thấy ví', 404));
  }

  const { count, rows } = await WalletTransaction.findAndCountAll({
    where: {
      wallet_id: wallet.wallet_id,
      tenant_id: req.user.tenant_id
    },
    limit,
    offset,
    order: [['created_at', 'DESC']]
  });

  paginationResponse(res, rows, count, page, limit, 'Lấy lịch sử giao dịch thành công');
});

module.exports = {
  getMerchantWallet,
  depositToWallet,
  payWithWallet,
  getWalletTransactions
};