const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const feeAssignmentController = require('../controllers/feeAssignmentcontrollerr');
const { protect, restrictTo } = require('../middleware/auth.middleware');
const validate = require('../middleware/validate');

const applyFeeValidation = [
  body('fee_id').isInt().withMessage('ID biểu phí không hợp lệ'),
  body('target_type').isIn(['kiosk', 'khu', 'loai_kiosk']).withMessage('Loại đối tượng không hợp lệ'),
  body('target_ids').isArray().withMessage('Danh sách đối tượng không hợp lệ')
];

router.use(protect, restrictTo(1, 2));

router.post('/', applyFeeValidation, validate, feeAssignmentController.applyFeeToTarget);

module.exports = router;
