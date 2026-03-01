const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const {protect} = require('../middleware/auth.middleware');

// Public routes
router.post('/login', authController.login);

// Protected routes
router.post('/logout', protect, authController.logout);
router.post('/change-password', protect, authController.changePassword);
router.get('/profile', protect, authController.getProfile);

module.exports = router;