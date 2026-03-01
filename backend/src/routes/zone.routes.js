const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const zoneController = require('../controllers/zone.controllerroller');
const { protect, restrictTo } = require('../middleware/auth.middleware');
const validate = require('../middleware/validate');

const createZoneValidation = [
  body('tenZone').notEmpty().withMessage('Tên khu không được để trống'),
  body('market_id').isInt().withMessage('Chợ không hợp lệ')
];

router.use(protect);

router.route('/')
  .post(restrictTo(1, 2), createZoneValidation, validate, zoneController.createZone)
  .get(zoneController.getZones);

router.route('/:id')
  .get(zoneController.getZoneById)
  .put(restrictTo(1, 2), zoneController.updateZone)
  .delete(restrictTo(1, 2), zoneController.deleteZone);

module.exports = router;