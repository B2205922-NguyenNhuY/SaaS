const express = require('express');
const router = express.Router();
const planController = require('../controllers/plan.controller');
const { protect, restrictTo, checkSuperAdmin } = require('../middleware/auth.middleware');
const { PERMISSIONS } = require('../config/auth');

// Public routes
router.get('/', protect, restrictTo(PERMISSIONS.VIEW_PLAN), planController.getAll);

// Super Admin only
router.post('/', protect, checkSuperAdmin, planController.create);
router.put('/:id', protect, checkSuperAdmin, planController.update);
router.post('/assign', protect, checkSuperAdmin, planController.assignToTenant);
router.get('/checkexpired', protect, checkSuperAdmin, planController.checkExpiredSubscriptions);

module.exports = router;