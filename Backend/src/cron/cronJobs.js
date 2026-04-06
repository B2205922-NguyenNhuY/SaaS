const cron = require('node-cron');
const chargeService = require('../services/charge.service');
const collectionPeriodService = require('../services/collectionperiod.service');
const notificationService = require('../services/notification.service');
const notificationModel = require('../models/notification.model');
const db = require('../config/db');
const { sendToMerchant } = require("../services/fcm.service");

// JOB 1: SINH PHÍ THÁNG (01:00 ngày đầu tháng)
cron.schedule('0 1 1 * *', async () => {
    console.log(`[${new Date().toISOString()}] --- BẮT ĐẦU SINH PHÍ THÁNG ---`);
    await processAutoCharges('month');
});

// JOB 2: SINH PHÍ NGÀY (01:00 mỗi ngày)
cron.schedule('26 1 * * *', async () => {
    console.log(`[${new Date().toISOString()}] --- BẮT ĐẦU SINH PHÍ NGÀY ---`);
    await processAutoCharges('day');
});

cron.schedule("40 20 * * *", async () => {
    console.log("Running charge overdue cron...");
    await updateOverdueCharges();
  });

// JOB 3: QUÉT NỢ QUÁ HẠN (07:00 sáng hàng ngày)
cron.schedule('31 21 * * *', async () => {
    console.log(`[${new Date().toISOString()}] --- QUÉT NỢ QUÁ HẠN (DỰA TRÊN NGÀY KẾT THÚC KỲ) ---`);

    try {
        const admin = require('../config/firebase');
        const overdueList = await chargeService.getExpiredCharges();
        console.log(overdueList);

        for (const item of overdueList) {
            const { tenant_id, merchant_id } = item;

            const notificationTitle = "Cảnh báo: Phí quá hạn thanh toán";
            const notificationContent = `Bạn có khoản nợ đã quá hạn. Vui lòng thanh toán ngay.`;

            //Gọi hàm tạo thông báo
            //Lưu ý: user_id trong bảng users của bạn thường khớp với merchant_id trong bảng merchant
            await notificationModel.autocreateNotification(
                tenant_id, 
                merchant_id, 
                notificationTitle, 
                notificationContent, 
                'tenant'
            );

            const res = await admin.messaging().send({
                topic: "merchant_${merchant_id}",
                notification: {
                    title: "Cảnh báo",
                    body: "Bạn có khoản nợ quá hạn",
                },
            });
            console.log(res);
            console.log(`[Overdue] Đã báo nợ cho Merchant ${merchant_id} - Số tiền: `);
        }
    } catch (err) {
        console.error("Lỗi Cron quét nợ quá hạn:", err);
    }
});

async function updateOverdueCharges() {
  try {
    
    const result = await chargeService.updatePendingCharges();

    console.log(`Updated overdue charges: ${result.affectedRows}`);
  } catch (err) {
    console.error("Cron error:", err.message);
  }
};

// Hàm dùng chung để tránh lặp code
async function processAutoCharges(type) {
    try {
        const [tenants] = await db.query("SELECT tenant_id FROM tenant WHERE trangThai = 'active'");

        for (const tenant of tenants) {
            try {
                let periodId;
                if (type === 'month') {
                    periodId = await collectionPeriodService.getOrCreateCurrentPeriod(tenant.tenant_id);
                } else {
                    periodId = await collectionPeriodService.getOrCreateDailyPeriod(tenant.tenant_id);
                }

                if (periodId) {
                    const result = await chargeService.generateChargesLogic(tenant.tenant_id, periodId);
                    
                    console.log(` Tenant ${tenant.tenant_id}: ${result.message}`);
                }
            } catch (err) {
                console.error(` Lỗi sinh phí ${type} cho Tenant ${tenant.tenant_id}:`, err.message);
            }
        }
    } catch (globalErr) {
        console.error("Lỗi hệ thống truy vấn Tenant:", globalErr);
    }
}