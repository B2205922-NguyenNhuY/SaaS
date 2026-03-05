const tenantModel = require("../models/tenant.model");
const { ROLES } = require("../constants/role");

exports.checkTenantActive = async (req, res, next) => {
    const { tenant_id, role} = req.user;
    if(role === ROLES.SUPER_ADMIN) {
        return next();
    }

    const tenant = await tenantModel.getTenantById(tenant_id);
    
    if (!tenant || tenant.length === 0) {
        return res.status(404).json({ message: "Tenant not found" });
    }

    if (tenant.trangThai !== "active") {
        return res.status(403).json({
        message: "Tenant is not active"
        });
    }

    next();
};