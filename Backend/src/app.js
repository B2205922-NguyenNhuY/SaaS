const express = require("express");
const cors = require("cors");
require("dotenv").config();
require("./cron/subscriptionCron");

const app = express();

app.use(cors());

app.use("/api/", require("./routes/webhook.routes"));

app.use(express.json());
app.use("/api/payment", require("./routes/payment.routes"));
app.use("/api/tenant", require("./routes/tenant.routes"));
app.use("/api/plan", require("./routes/plan.routes"));
app.use("/api/plan_subscription", require("./routes/plan_subscription.routes"));
app.use("/api/role", require("./routes/role.routes"));
app.use("/api/users", require("./routes/users.routes"));
app.use("/api/auth", require("./routes/auth.routes"));
app.use("/api/super_admin", require("./routes/super_admin.routes"));

module.exports = app;