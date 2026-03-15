const { ROLES } = require("../constants/role");

exports.checkTenantAccess = async (req, res, next) => {
    const paramTenantId = Number(
        req.body?.tenant_id ||
        req.params?.id ||
        req.query?.id
    );
    const { tenant_id, role} = req.user;
    console.log(paramTenantId);
    if(role === ROLES.SUPER_ADMIN) {
        return next();
    }

        if(tenant_id != paramTenantId) {
            return res.status(403).json({
                message: "You can only manage your own tenant"
            });
        }
        return next();

    return res.status(403).json({message: "Forbidden - Cross tenant access denied",});
};