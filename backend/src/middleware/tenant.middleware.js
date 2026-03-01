const { Tenant } = require('../models');

const validateTenant = async (req, res, next) => {
  try {
    const tenant_id = req.params.tenant_id || req.body.tenant_id || req.query.tenant_id;
    
    if (!tenant_id && req.user.role?.tenVaiTro !== 'SUPER_ADMIN') {
      return res.status(400).json({ message: 'tenant_id is required' });
    }

    if (tenant_id) {
      const tenant = await Tenant.findByPk(tenant_id);
      if (!tenant || tenant.trangThai !== 'active') {
        return res.status(404).json({ message: 'Tenant not found or inactive' });
      }
      req.tenant = tenant;
    }

    next();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const checkQuota = (resourceType) => {
  return async (req, res, next) => {
    try {
      const tenant_id = req.tenant_id || req.body.tenant_id;
      const subscription = await req.tenant.getActiveSubscription();
      
      if (!subscription) {
        return res.status(403).json({ message: 'No active subscription' });
      }

      const plan = await subscription.getPlan();
      let currentCount = 0;

      switch (resourceType) {
        case 'kiosk':
          currentCount = await Kiosk.count({ where: { tenant_id } });
          if (currentCount >= plan.gioiHanSoKiosk) {
            return res.status(403).json({ message: 'Kiosk quota exceeded' });
          }
          break;
        case 'user':
          currentCount = await User.count({ where: { tenant_id } });
          if (currentCount >= plan.gioiHanUser) {
            return res.status(403).json({ message: 'User quota exceeded' });
          }
          break;
        case 'market':
          currentCount = await Market.count({ where: { tenant_id } });
          if (currentCount >= plan.gioiHanSoCho) {
            return res.status(403).json({ message: 'Market quota exceeded' });
          }
          break;
      }

      next();
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  };
};

module.exports = { validateTenant, checkQuota };