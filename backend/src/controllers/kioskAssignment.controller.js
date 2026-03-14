const S = require("../services/kioskAssignment.service");

exports.assign = async (req, res, next) => {
  try {
    const tenant_id = req.user.tenant_id;
    const data = await S.assign(tenant_id, req.body);
    res.status(201).json(data);
  } catch (e) {
    next(e);
  }
};

exports.end = async (req, res, next) => {
  try {
    const tenant_id = req.user.tenant_id;
    const assignment_id = Number(req.params.id);

    const result = await S.end(tenant_id, assignment_id);

    return res.status(200).json({
      success: true,
      message: "Assignment ended successfully",
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

exports.list = async (req, res, next) => {
  try {
    const tenant_id = req.user.tenant_id;
    const filters = {
      kiosk_id: req.query.kiosk_id,
      merchant_id: req.query.merchant_id,
      trangThai: req.query.trangThai,
      q: req.query.q,
    };
    res.json(await S.list(tenant_id, filters, req.pagination));
  } catch (e) {
    next(e);
  }
};