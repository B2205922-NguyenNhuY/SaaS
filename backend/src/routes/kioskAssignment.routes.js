const express = require('express');
const router = express.Router();
const kioskAssignmentController = require('../controllers/kioskAssignment.Controller');
const { protect, restrictTo } = require('../middleware/auth.middleware');

router.use(protect);

router.put('/:id/end', restrictTo(1, 2), kioskAssignmentController.endKioskAssignment);

module.exports = router;