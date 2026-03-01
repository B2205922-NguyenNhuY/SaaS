const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const walletController = require('../controllers/wallet.controller');
const { protect, restrictTo } = require('../middleware/auth.middleware');
const validate = require('../middleware/validate');

const transactionValidation = [
  body('soTien').isFloat({ min: 0 }).withMessage('Số tiền phải lớn hơn 0')
];

router.use(protect);

router.get('/merchant/:merchantId', walletController.getMerchantWallet);
router.post('/:walletId/deposit', restrictTo(1, 2), transactionValidation, validate, walletController.depositToWallet);
router.post('/:walletId/pay', restrictTo(1, 2), transactionValidation, validate, walletController.payWithWallet);
router.get('/:walletId/transactions', walletController.getWalletTransactions);

module.exports = router;