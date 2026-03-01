const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notification.controller');
const {protect, restrictTo} = require('../middleware/auth.middleware');
const { PERMISSIONS } = require('../config/auth');

router.use(protect);

router.post('/', restrictTo(2), notificationController.create);
router.get('/', restrictTo(2), notificationController.getAll);
router.patch('/:id/read', restrictTo(2), notificationController.markAsRead);
router.post('/mark-all-read', restrictTo(2), notificationController.markAllAsRead);
router.get('/:id', restrictTo(2), notificationController.getNotificationById);

module.exports = router;
