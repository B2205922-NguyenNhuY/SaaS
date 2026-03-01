const express = require('express');
const router = express.Router();
const receiptController = require('../controllers/receipt.controller');
const { protect, restrictTo } = require('../middleware/auth.middleware');
const upload = require('../middleware/upload.middleware');
const { PERMISSIONS } = require('../config/auth');

router.use(protect);

router.post(
  '/',
  restrictTo(PERMISSIONS.COLLECT_FEE),
  upload.single('image'),
  receiptController.create
);

router.post(
  '/upload-image',
  restrictTo(PERMISSIONS.COLLECT_FEE),
  upload.single('image'),
  receiptController.uploadImage
);

router.post('/sync-offline', restrictTo(PERMISSIONS.COLLECT_FEE), receiptController.syncOffline);
router.get('/', restrictTo(PERMISSIONS.VIEW_RECEIPT), receiptController.getAll);
router.get('/:id', restrictTo(PERMISSIONS.VIEW_RECEIPT), receiptController.getById);

module.exports = router;
