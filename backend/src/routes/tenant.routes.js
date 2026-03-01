const express = require('express');
const router = express.Router();
const tenantController = require('../controllers/tenant.controller');
const { protect, checkSuperAdmin } = require('../middleware/auth.middleware');

router.use(protect, checkSuperAdmin);

router.post('/', tenantController.create);
router.get('/', tenantController.getAll);
router.get('/:id', tenantController.getById);
router.put('/:id', tenantController.update);
router.patch('/:id/toggle-status', tenantController.toggleStatus);

module.exports = router;