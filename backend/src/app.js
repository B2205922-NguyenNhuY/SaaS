const express = require("express");
const cors = require("cors");
require("dotenv").config();
require("./cron/subscriptionCron");

const app = express();

app.use(cors());


app.use(express.json());
app.use("/api/auth", require("./routes/auth.routes"));
app.use("/api/payment", require("./routes/payment.routes"));
app.use("/api/tenant", require("./routes/tenant.routes"));
app.use("/api/plan", require("./routes/plan.routes"));
app.use("/api/plan_subscription", require("./routes/plan_subscription.routes"));
app.use("/api/role", require("./routes/role.routes"));
app.use("/api/users", require("./routes/users.routes"));
app.use("/api/super_admin", require("./routes/super_admin.routes"));
app.use("/api/webhook", require("./routes/webhook.routes"));


app.use("/api/fee_assignments", require("./routes/feeAssignment.routes"));
app.use("/api/charge", require("./routes/charge.routes"));
app.use("/api/collection_periods", require("./routes/collectionperiod.routes"));
app.use("/api/audit_log", require("./routes/auditlog.routes"));
app.use("/api/notifications", require("./routes/notification.routes"));
app.use("/api/fees", require("./routes/feeSchedule.routes"));
app.use("/api/receipt_charge", require("./routes/receiptCharge.routes"));
app.use("/api/receipt", require("./routes/receipt.routes"));
app.use("/api/reports", require("./routes/report.routes"));
app.use("/api/shifts", require("./routes/shift.routes"));
app.use("/api/debts", require("./routes/debt.routes"));


app.use("/api/markets", require("./routes/market.routes"));
app.use("/api/zones", require("./routes/zone.routes"));
app.use("/api/kiosk_types", require("./routes/kioskType.routes"));
app.use("/api/kiosks", require("./routes/kiosk.routes"));
app.use("/api/merchants", require("./routes/merchant.routes"));
app.use("/api/kiosk_assignments", require("./routes/kioskAssignment.routes"));


app.get("/health", (req, res) => {
  res.json({ ok: true });
});

app.get("/api/health", (req, res) => {
  res.json({ ok: true });
});




module.exports = app;