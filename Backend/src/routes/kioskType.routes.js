const router = require('express').Router();
const paginate = require('../middlewares/paginate');
const kioskTypeController = require('../controllers/kioskType.controller');
const { verifyToken } = require('../middlewares/auth.middleware');
const { authorizeRoles } = require('../middlewares/role.middleware');
const { ROLES } = require('../constants/role');
const { checkUserActive } = require('../middlewares/checkUserActive.middlewares');
const { checkTenantActive } = require('../middlewares/checkTenantActive.middlewares');
const { checkTenantAccess } = require('../middlewares/checkTenantAccess.middleware');
const { checkSubscriptionStatus } = require('../middlewares/checkSubscription.middlewares');

router.post('/', verifyToken, authorizeRoles(ROLES.SUPER_ADMIN), checkUserActive, checkTenantActive, checkTenantAccess, checkSubscriptionStatus, kioskTypeController.create);
router.put('/:id', verifyToken, authorizeRoles(ROLES.SUPER_ADMIN), checkUserActive, checkTenantActive, checkTenantAccess, checkSubscriptionStatus, kioskTypeController.update);
router.get('/', verifyToken, authorizeRoles(ROLES.SUPER_ADMIN), checkUserActive, checkTenantActive, checkTenantAccess, paginate, kioskTypeController.list);
router.get('/:id', verifyToken, authorizeRoles(ROLES.SUPER_ADMIN), checkUserActive, checkTenantActive, checkTenantAccess, checkSubscriptionStatus, kioskTypeController.getById);
module.exports = router;
