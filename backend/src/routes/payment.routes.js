const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const paymentController = require('../controllers/payment.controller');
const { protect } = require('../middleware/auth.middleware');
const { uploadSingle, handleMulterError } = require('../middleware/upload.middleware');
const validate = require('../middleware/validate');

const createPaymentValidation = [
  body('charge_id').isInt().withMessage('ID khoản phí không hợp lệ'),
  body('soTien').isFloat({ min: 0 }).withMessage('Số tiền phải lớn hơn 0'),
  body('hinhThucThu').isIn(['tien_mat', 'chuyen_khoan']).withMessage('Hình thức thu không hợp lệ')
];

router.use(protect);

router.route('/')
  .post(
    uploadSingle,
    handleMulterError,
    createPaymentValidation,
    validate,
    paymentController.createPayment
  )
  .get(paymentController.getPayments);

router.post('/sync_offline', paymentController.syncOfflinePayments);
router.get('/:id', paymentController.getPaymentById);

module.exports = router;