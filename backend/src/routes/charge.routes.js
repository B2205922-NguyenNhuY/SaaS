
const express = require('express');
const router = express.Router();
const chargeController = require('../controllers/charge.controller');
const { protect, restrictTo } = require('../middleware/auth.middleware');

router.use(protect);

router.get('/', chargeController.getCharges);
router.get('/:id', chargeController.getChargeById);
router.patch('/:id/status', restrictTo(2), chargeController.updateChargeStatus);
router.get('/:id/history', chargeController.getChargeHistory);

module.exports = router;