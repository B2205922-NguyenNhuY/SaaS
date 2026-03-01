const express = require('express');
const router = express.Router();
const debtController = require('../controllers/debt.controller');
const { protect, restrictTo } = require('../middleware/auth.middleware');
const { PERMISSIONS } = require('../config/auth');

router.use(protect);

router.get('/', restrictTo(PERMISSIONS.VIEW_DEBT), debtController.getDebts);
router.get('/summary', restrictTo(PERMISSIONS.VIEW_DEBT), debtController.getDebtSummary);

module.exports = router;
