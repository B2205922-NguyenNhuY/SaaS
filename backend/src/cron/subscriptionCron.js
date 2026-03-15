const cron = require("node-cron");
const db = require("../config/database");

cron.schedule("*/5 * * * *", async () => {
  try {
    await db.execute(`
      UPDATE plan_subscription
      SET trangThai = 'expired'
      WHERE trangThai = 'active'
      AND ngayKetThuc < NOW()
    `);

    console.log("Expired subscriptions updated");
  } catch (error) {
    console.error("Cron error:", error);
  }
});
