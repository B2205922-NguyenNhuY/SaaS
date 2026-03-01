const express = require('express');
const router = express.Router();
const shiftController = require('../controllers/shift.controller');
const { protect, restrictTo } = require('../middleware/auth.middleware');

router.use(protect);

router.post('/start', shiftController.startShift);
router.post('/:id/end', shiftController.endShift);
router.post('/:id/reconcile', restrictTo(1, 2), shiftController.reconcileShift);
router.get('/', shiftController.getShifts);
router.get('/:id', shiftController.getShiftById);

module.exports = router;

