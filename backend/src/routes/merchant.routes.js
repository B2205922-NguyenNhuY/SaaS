const express = require('express');
const router = express.Router();
const merchantController = require('../controllers/merchant.controller');
const { protect, restrictTo} = require('../middleware/auth.middleware');
const { PERMISSIONS } = require('../config/auth');

router.use(protect);

router.post('/', restrictTo(PERMISSIONS.CREATE_MERCHANT), merchantController.create);
router.get('/', restrictTo(PERMISSIONS.VIEW_MERCHANT), merchantController.getAll);
router.get('/:id', restrictTo(PERMISSIONS.VIEW_MERCHANT), merchantController.getById);
router.put('/:id', restrictTo(PERMISSIONS.UPDATE_MERCHANT), merchantController.update);

// Kiosk assignment
router.post('/assign-kiosk', restrictTo(PERMISSIONS.ASSIGN_KIOSK), merchantController.assignKiosk);
router.put('/assignments/:id/end', restrictTo(PERMISSIONS.ASSIGN_KIOSK), merchantController.endAssignment);

module.exports = router;