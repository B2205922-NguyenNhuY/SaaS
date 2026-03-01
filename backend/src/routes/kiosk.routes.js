const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const kioskController = require('../controllers/kiosk.controller');
const { protect, restrictTo } = require('../middleware/auth.middleware');
const { checkTenantQuota } = require('../middleware/tenant.middleware');
const { uploadMultiple, handleMulterError } = require('../middleware/upload.middleware');
const validate = require('../middleware/validate');

// Validation rules
const createKioskValidation = [
  body('maKiosk').notEmpty().withMessage('Mã kiosk không được để trống'),
  body('type_id').isInt().withMessage('Loại kiosk không hợp lệ'),
  body('market_id').isInt().withMessage('Chợ không hợp lệ')
];

// All routes require authentication
router.use(protect);

router.route('/')
  .post(
    restrictTo(1, 2), // Super Admin or Tenant Admin
    checkTenantQuota('create_kiosk'),
    uploadMultiple,
    handleMulterError,
    createKioskValidation,
    validate,
    kioskController.createKiosk
  )
  .get(kioskController.getKiosks);

router.route('/:id')
  .get(kioskController.getKioskById)
  .put(
    restrictTo(1, 2),
    uploadMultiple,
    handleMulterError,
    kioskController.updateKiosk
  );

router.patch('/:id/status', restrictTo(1, 2), kioskController.updateKioskStatus);
router.post('/:id/images', restrictTo(1, 2), uploadMultiple, handleMulterError, kioskController.uploadKioskImages);
router.delete('/:id/images/:index', restrictTo(1, 2), kioskController.deleteKioskImage);

module.exports = router;