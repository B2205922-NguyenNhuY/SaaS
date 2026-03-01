const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const kioskTypeController = require('../controllers/kiosktype.controller');
const { protect, restrictTo } = require('../middleware/auth.middleware');
const validate = require('../middleware/validate');

const createKioskTypeValidation = [
  body('tenLoai').notEmpty().withMessage('Tên loại kiosk không được để trống')
];

router.use(protect);

router.route('/')
  .post(restrictTo(1, 2), createKioskTypeValidation, validate, kioskTypeController.createKioskType)
  .get(kioskTypeController.getKioskTypes);

router.route('/:id')
  .get(kioskTypeController.getKioskTypeById)
  .put(restrictTo(1, 2), kioskTypeController.updateKioskType)
  .delete(restrictTo(1, 2), kioskTypeController.deleteKioskType);

module.exports = router;