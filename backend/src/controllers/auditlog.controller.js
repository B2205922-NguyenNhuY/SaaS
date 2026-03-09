const auditLogService = require("../services/auditlog.service");


// Lấy log theo super admin
exports.getSuperAdminLogs = async (req, res, next) => {

    try {
        const super_admin_id = req.user.admin_id;

        const logs = await auditLogService.getSuperAdminLogs(super_admin_id);

        res.json(logs);

    } catch (err) {

        next(err);

    }

};

// Lấy log theo tenant
exports.getTenantLogs = async (req, res, next) => {

    try {

        const tenant_id = req.user.tenant_id;

        const logs = await auditLogService.getTenantLogs(tenant_id);

        res.json(logs);

    } catch (err) {

        next(err);

    }

};


// Lấy log theo entity
exports.getEntityLogs = async (req, res, next) => {

    try {

        const { entity_type, entity_id } = req.params;

        const tenant_id = req.user.tenant_id;

        const logs =
            await auditLogService.getEntityLogs(
                entity_type,
                entity_id,
                tenant_id
            );

        res.json(logs);

    } catch (err) {

        next(err);

    }

};