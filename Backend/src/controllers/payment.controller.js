const paymentService = require("../services/payment.service");
const { logAudit } = require("../utils/audit");

exports.createCheckoutSession = async (req, res, next) => {
  try {
    const result = await paymentService.createCheckoutSession(
      req.user,
      req.body
    );

    await logAudit(req, {
      action: "THANH_TOAN",
      entity_type: "payment",
      entity_id: result.session_id,
      newValue: {
        ...req.body,
        session_id: result.session_id
      },
    });

    res.json({
      url: result.url,
      session_id: result.session_id
    });

  } catch (error) {
    next(error);
  }
};