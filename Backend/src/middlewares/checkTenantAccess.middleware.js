const { ROLES } = require("../constants/role");

exports.checkTenantAccess = async (req, res, next) => {
    const paramTenantId = parseInt(req.body.tenant_id);
    const { tenant_id, role} = req.user;
    console.log(paramTenantId);
    if(role === ROLES.SUPER_ADMIN) {
        return next();
    }

    if (role == ROLES.TENANT_ADMIN) {
        if(tenant_id != paramTenantId) {
            return res.status(403).json({
                message: "You can only manage your own tenant"
            });
        }
        return next();
    }

    return res.status(403).json({message: "Forbidden - Cross tenant access denied",});
};