const express = require('express');
const router = express.Router();
const reportController = require('../controllers/report.controller');
const { protect, restrictTo} = require('../middleware/auth.middleware');
const { PERMISSIONS } = require('../config/auth');

router.use(protect);

router.get('/revenue', restrictTo(PERMISSIONS.VIEW_REPORT), reportController.getRevenueReport);
router.get('/revenue/location', restrictTo(PERMISSIONS.VIEW_REPORT), reportController.getRevenueByLocation);
router.get('/revenue/collector', restrictTo(PERMISSIONS.VIEW_REPORT), reportController.getRevenueByCollector);
router.get('/export', restrictTo(PERMISSIONS.EXPORT_REPORT), reportController.exportReport);

module.exports = router;