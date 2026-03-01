const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const { protect, restrictTo} = require('../middleware/auth.middleware');
const { PERMISSIONS } = require('../config/auth');

router.use(protect);

router.post('/', restrictTo(PERMISSIONS.CREATE_USER), userController.create);
router.get('/', restrictTo(PERMISSIONS.VIEW_USER), userController.getAll);
router.get('/:id', restrictTo(PERMISSIONS.VIEW_USER), userController.getById);
router.put('/:id', restrictTo(PERMISSIONS.UPDATE_USER), userController.update);
router.delete('/:id', restrictTo(PERMISSIONS.DELETE_USER), userController.delete);

module.exports = router;