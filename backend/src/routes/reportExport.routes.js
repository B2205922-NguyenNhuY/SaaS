const express = require('express');
const router = express.Router();
const reportExportController = require('../controllers/reportExport.controller');
const { protect } = require('../middleware/auth.middleware');

router.use(protect);

router.get('/export/excel', reportExportController.exportToExcel);
router.get('/export/pdf', reportExportController.exportToPDF);

module.exports = router;