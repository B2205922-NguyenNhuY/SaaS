const express = require('express');
const router = express.Router();
const marketController = require('../controllers/market.controller');
const { protect, restrictTo } = require('../middleware/auth.middleware');
const { checkQuota } = require('../middleware/tenant.middleware');
const { PERMISSIONS } = require('../config/auth');

router.use(protect);

// Market routes
router.post('/', restrictTo(PERMISSIONS.CREATE_MARKET), checkQuota('market'), marketController.createMarket);
router.get('/', restrictTo(PERMISSIONS.VIEW_MARKET), marketController.getAllMarkets);
router.get('/:id', restrictTo(PERMISSIONS.VIEW_MARKET), marketController.getMarketById);
router.put('/:id', restrictTo(PERMISSIONS.UPDATE_MARKET), marketController.updateMarket);

// Zone routes
router.post('/zones', restrictTo(PERMISSIONS.CREATE_ZONE), marketController.createZone);
router.get('/:marketId/zones', restrictTo(PERMISSIONS.VIEW_ZONE), marketController.getZonesByMarket);

// Kiosk type routes
router.post('/kiosk-types', restrictTo(PERMISSIONS.CREATE_KIOSK), marketController.createKioskType);
router.get('/kiosk-types/all', restrictTo(PERMISSIONS.VIEW_KIOSK), marketController.getAllKioskTypes);

// Kiosk routes
router.post('/kiosks', restrictTo(PERMISSIONS.CREATE_KIOSK), checkQuota('kiosk'), marketController.createKiosk);
router.get('/kiosks/all', restrictTo(PERMISSIONS.VIEW_KIOSK), marketController.getAllKiosks);
router.get('/kiosks/:id', restrictTo(PERMISSIONS.VIEW_KIOSK), marketController.getKioskById);
router.put('/kiosks/:id', restrictTo(PERMISSIONS.UPDATE_KIOSK), marketController.updateKiosk);

module.exports = router;