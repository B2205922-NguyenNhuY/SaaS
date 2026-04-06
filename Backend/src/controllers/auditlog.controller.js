const service = require("../services/auditLog.service");

// GET /audit-logs
exports.getAllLogs = async (req, res, next) => {
  try {
    const result = await service.getLogs(
      req.user,
      req.query,
      req.pagination
    );

    res.json(result);
  } catch (err) {
    next(err);
  }
};


// GET /audit-logs/superadmin
exports.getSuperAdminLogs = async (req, res, next) => {
  try {
    const result = await service.getLogs(
      req.user,
      req.query,
      req.pagination
    );

    res.json(result);
  } catch (err) {
    next(err);
  }
};


// GET /audit-logs/tenant
exports.getTenantLogs = async (req, res, next) => {
  try {
    const result = await service.getLogs(
      req.user,
      req.query,
      req.pagination
    );

    res.json(result);
  } catch (err) {
    next(err);
  }
};


// GET /audit-logs/entity/:entity_type/:entity_id
exports.getEntityLogs = async (req, res, next) => {
  try {
    const query = {
      ...req.query,
      entity_type: req.params.entity_type,
      entity_id: req.params.entity_id,
    };

    const result = await service.getLogs(
      req.user,
      query,
      req.pagination
    );

    res.json(result);
  } catch (err) {
    next(err);
  }
};