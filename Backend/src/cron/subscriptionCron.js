const cron = require("node-cron");
const db = require("../config/db");
const planSubscriptionModel = require("../models/plan_subscription.model");

// Chạy mỗi giờ để kiểm tra và xử lý subscription hết hạn
cron.schedule("0 * * * *", async () => {
    console.log(`[${new Date().toISOString()}] Running subscription expiry checker...`);
    
    try {
        // Xử lý các subscription hết hạn (trial, active)
        const expiredSubs = await planSubscriptionModel.checkAndProcessExpired();
        
        if (expiredSubs && expiredSubs.length > 0) {
            console.log(`[${new Date().toISOString()}] Locked ${expiredSubs.length} tenants due to overdue payments`);
            
            for (const sub of expiredSubs) {
                await db.execute(
                    `INSERT INTO audit_log (tenant_id, hanhDong, entity_type, entity_id, giaTriMoi) 
                    VALUES (?, 'TENANT_LOCKED_DUE_OVERDUE', 'tenant', ?, ?)`,
                    [sub.tenant_id, sub.tenant_id, JSON.stringify({ subscription_id: sub.subscription_id })]
                );
            }
        }
        
        console.log(`[${new Date().toISOString()}] Subscription expiry check completed`);
        
    } catch (error) {
        console.error("[Cron Error] Subscription expiry checker:", error);
    }
});

// Chạy lúc 00:00 mỗi ngày để reset các thống kê
cron.schedule("0 0 * * *", async () => {
    console.log(`[${new Date().toISOString()}] Running daily subscription summary...`);
    
    try {
        const [stats] = await db.execute(`
            SELECT 
                COUNT(CASE WHEN trangThai = 'active' THEN 1 END) as active_count,
                COUNT(CASE WHEN trangThai = 'trial' THEN 1 END) as trial_count,
                COUNT(CASE WHEN trangThai = 'expired' THEN 1 END) as expired_count
            FROM plan_subscription
        `);
        
        console.log(`[Daily Stats] Active: ${stats[0]?.active_count || 0}, Trial: ${stats[0]?.trial_count || 0}, Expired: ${stats[0]?.expired_count || 0}`);
        
    } catch (error) {
        console.error("[Cron Error] Daily subscription summary:", error);
    }
});