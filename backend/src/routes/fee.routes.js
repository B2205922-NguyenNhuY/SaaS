const express = require('express');
const router = express.Router();
const feeController = require('../controllers/fee.controller');
const { protect, restrictTo} = require('../middleware/auth.middleware');
const { PERMISSIONS } = require('../config/auth');

router.use(protect);

// Fee schedule
router.post('/', restrictTo(PERMISSIONS.CREATE_FEE), feeController.createFee);
router.get('/', restrictTo(PERMISSIONS.VIEW_FEE), feeController.getAllFees);
router.put('/:id', restrictTo(PERMISSIONS.UPDATE_FEE), feeController.updateFee);

// Fee assignment
router.post('/assignments', restrictTo(PERMISSIONS.APPLY_FEE), feeController.applyFee);
router.get('/assignments/active', restrictTo(PERMISSIONS.VIEW_FEE), feeController.getActiveAssignments);

module.exports = router;

