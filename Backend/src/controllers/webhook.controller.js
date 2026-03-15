const webhookService = require("../services/webhook.service");

exports.handleStripeWebhook = async (req, res, next) => {
  try {
    await webhookService.handleStripeWebhook(req);

    res.status(200).json({ received: true });

  } catch (error) {

    next(error);
  }
};