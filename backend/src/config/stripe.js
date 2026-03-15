const Stripe = require("stripe");
const key = process.env.STRIPE_SECRET_KEY;
module.exports = key ? new Stripe(key) : null;
