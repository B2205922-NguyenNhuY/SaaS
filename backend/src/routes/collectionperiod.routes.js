const express = require('express');
const router = express.Router();
const collectionController = require('../controllers/collectionperiod.controller');
const { protect, restrictTo } = require('../middleware/auth.middleware');
const { PERMISSIONS } = require('../config/auth');

router.use(protect);

// Collection periods
router.post('/periods', restrictTo(PERMISSIONS.CREATE_PERIOD), collectionController.createPeriod);
router.get('/periods', restrictTo(PERMISSIONS.VIEW_PERIOD), collectionController.getAllPeriods);

// Charges
router.post('/periods/:period_id/generate-charges', restrictTo(PERMISSIONS.GENERATE_CHARGE), collectionController.generateCharges);
router.get('/charges', restrictTo(PERMISSIONS.VIEW_CHARGE), collectionController.getAllCharges);
router.patch('/charges/:id/status', restrictTo(PERMISSIONS.UPDATE_DEBT_STATUS), collectionController.updateChargeStatus);
router.get('/charges/:id/history', restrictTo(PERMISSIONS.VIEW_CHARGE), collectionController.getChargeHistory);

// Shifts
router.post('/shifts/start', restrictTo(PERMISSIONS.START_SHIFT), collectionController.startShift);
router.post('/shifts/end', restrictTo(PERMISSIONS.END_SHIFT), collectionController.endShift);
router.get('/shifts', restrictTo(PERMISSIONS.VIEW_SHIFT), collectionController.getAllShifts);

module.exports = router;
