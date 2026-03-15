const express = require("express");
const cors = require("cors");
require("dotenv").config();
require("./cron/subscriptionCron");

const app = express();
app.use(cors());

// Stripe webhook must use raw body before express.json()
app.use("/api/payments", require("./routes/webhook.routes"));

app.use(express.json());

// Auth + SaaS core
app.use("/api/auth", require("./routes/auth.routes"));
app.use("/api/users", require("./routes/users.routes"));
app.use("/api/tenants", require("./routes/tenant.routes"));
app.use("/api/plans", require("./routes/plan.routes"));
app.use("/api/subscriptions", require("./routes/plan_subscription.routes"));
app.use("/api/super_admins", require("./routes/super_admin.routes"));
app.use("/api/roles", require("./routes/role.routes"));

// Payment aliases matching API sheet
app.use("/api/payments", require("./routes/payment.routes"));
app.use("/api/payment", require("./routes/payment.routes"));

// Market / zone / kiosk / merchant
app.use("/api/markets", require("./routes/market.routes"));
app.use("/api/zones", require("./routes/zone.routes"));
app.use("/api/kiosk_types", require("./routes/kioskType.routes"));
app.use("/api/kiosk-types", require("./routes/kioskType.routes"));
app.use("/api/kiosks", require("./routes/kiosk.routes"));
app.use("/api/merchants", require("./routes/merchant.routes"));
app.use("/api/kiosk_assignments", require("./routes/kioskAssignment.routes"));
app.use("/api/kiosk-assignments", require("./routes/kioskAssignment.routes"));

// Fee / collection / charge / receipt / debt / report / audit / shift / notification
app.use("/api/fees", require("./routes/feeSchedule.routes"));
app.use("/api/fees_assignment", require("./routes/feeAssignment.routes"));
app.use("/api/fee_assignments", require("./routes/feeAssignment.routes"));
app.use("/api/fees-assignment", require("./routes/feeAssignment.routes"));
app.use("/api/collection_periods", require("./routes/collectionperiod.routes"));
app.use("/api/charges", require("./routes/charge.routes"));
app.use("/api/chages", require("./routes/charge.routes")); // alias typo from API sheet
app.use("/api/receipts", require("./routes/receipt.routes"));
app.use("/api/receipt_charges", require("./routes/receiptCharge.routes"));
app.use("/api/debts", require("./routes/debt.routes"));
app.use("/api/reports", require("./routes/report.routes"));
app.use("/api/audit_logs", require("./routes/auditlog.routes"));
app.use("/api/shifts", require("./routes/shift.routes"));
app.use("/api/notifications", require("./routes/notification.routes"));

// Optional centralized handler for SaaS branch modules
try {
  app.use(require("./middlewares/errorHandler"));
} catch (_) {}

module.exports = app;
