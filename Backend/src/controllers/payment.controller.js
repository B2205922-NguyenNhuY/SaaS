const paymentService = require("../services/payment.service");

exports.createCheckoutSession = async (req, res, next) => {
  try {
    const result = await paymentService.createCheckoutSession(
      req.user,
      req.body
    );

    res.json({
      url: result.url,
      session_id: result.session_id
    });

  } catch (error) {
    next(error);
  }
};