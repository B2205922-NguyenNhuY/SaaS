
const express = require('express');
const router = express.Router();
const auditLogController = require('../controllers/auditlog.controller');
const { protect, restrictTo } = require('../middleware/auth.middleware');
const { PERMISSIONS } = require('../config/auth');

router.use(protect, restrictTo(1, 2)); 

router.get('/', auditLogController.getLogs);
router.get('/:id', auditLogController.getLogById);

module.exports = router;