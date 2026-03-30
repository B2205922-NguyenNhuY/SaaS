const chargeModel = require("../models/charge.model");
const auditLogModel = require("../models/auditLog.model");
const collectionPeriodModel = require('../models/collectionPeriod.model');
const notificationModel = require('../models/notification.model');
const db = require("../config/db");
const { sendToMerchant } = require("../services/fcm.service");

// Tạo charge
exports.createCharge = async (data, user) => {
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const existing = await chargeModel.getChargeByKioskAndPeriod(
      user.tenant_id,
      data.period_id,
      data.kiosk_id,
    );

    if (existing) {
      throw new Error("Charge already exists");
    }

    const result = await chargeModel.createCharge(connection, {
      ...data,
      tenant_id: user.tenant_id,
    });

    await auditLogModel.createAuditLog({
      tenant_id: user.tenant_id,
      user_id: user.id,
      hanhDong: "CREATE_CHARGE",
      entity_type: "charge",
      entity_id: result.insertId,
      giaTriMoi: data,
    });

    await connection.commit();

    return result;
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
};

// Lấy charge theo period
exports.getChargesByPeriod = async (period_id, user) => {
  return await chargeModel.getChargesByPeriod(user.tenant_id, period_id);
};
exports.getChargesById = async (id, user) => {
  return await chargeModel.getChargesById(user.tenant_id, id);
};
// Lấy charge theo merchant
exports.getChargesByMerchant = async (merchant_id, user) => {
  return await chargeModel.getChargesByMerchant(user.tenant_id, merchant_id);
};

// Cập nhật trạng thái charge
exports.updateChargeStatus = async (charge_id, data, user) => {
  const oldCharge = await chargeModel.getChargeById(user.tenant_id, charge_id);

  const result = await chargeModel.updateChargeStatus(
    charge_id,
    user.tenant_id,
    data,
  );

  await auditLogModel.createAuditLog({
    tenant_id: user.tenant_id,
    user_id: user.id,
    hanhDong: "UPDATE_CHARGE_STATUS",
    entity_type: "charge",
    entity_id: charge_id,
    giaTriCu: oldCharge,
    giaTriMoi: data,
  });

  return result;
};

// Cập nhật trạng thái nợ
exports.updateDebtStatus = async (charge_id, data, user) => {
  const oldCharge = await chargeModel.getChargeById(user.tenant_id, charge_id);

  if (!oldCharge) {
    throw new Error("Charge not found");
  }

  const newPaidAmount = data.soTienDaThu;

  if (newPaidAmount > oldCharge.soTienPhaiThu) {
    throw new Error("Payment exceeds required amount");
  }

  let status = "chua_thu";

  if (newPaidAmount >= oldCharge.soTienPhaiThu) {
    status = "da_thu";
  } else if (newPaidAmount > 0) {
    status = "no";
  }

  const result = await chargeModel.updateDebtStatus(charge_id, user.tenant_id, {
    soTienDaThu: newPaidAmount,
    trangThai: status,
  });

  await auditLogModel.createAuditLog({
    tenant_id: user.tenant_id,
    user_id: user.id,
    hanhDong: "UPDATE_DEBT_STATUS",
    entity_type: "charge",
    entity_id: charge_id,
    giaTriCu: oldCharge,
    giaTriMoi: {
      soTienDaThu: newPaidAmount,
      trangThai: status,
    },
  });

  return result;
};

// Lấy lịch sử thay đổi charge
exports.getChargeHistory = async (charge_id, user) => {
  return await chargeModel.getChargeHistory(user.tenant_id, charge_id);
};


exports.generateChargesLogic = async (tenant_id, period_id) => {
    // 1. Kiểm tra kỳ thu tồn tại
    const period = await collectionPeriodModel.getCollectionPeriodById(period_id, tenant_id);
    if (!period) {
        throw Object.assign(new Error("Kỳ thu không hợp lệ"), { statusCode: 404 });
    }

    // 2. Thực thi lệnh sinh phí hàng loạt từ Model
    const result = await chargeModel.insertAutoCharges(
        tenant_id, 
        period_id, 
        period.loaiKy
    );

    if (result.count > 0) {
        try {
            const notificationTitle = "🔔 Có khoản phí mới";
            const notificationContent = `Bạn có khoản phí mới cho ${period.tenKyThu}.`;
            console.log(result.Ids);
            // Insert thông báo vào DB cho từng user liên quan
            for (const id of result.Ids) {
                await notificationModel.autocreateNotification(tenant_id, id, notificationTitle, notificationContent, 'system');
                await sendToMerchant(
                  id,
                  notificationTitle,
                  notificationContent,
                  {
                      type: "notification",
                  }
              );
                console.log(`[Notification] Đã phát thông báo phí mới cho Merchant ${id}`);
              }
            
        } catch (noteErr) {
            console.error("Lỗi khi tạo thông báo tự động:", noteErr.message);
            // Không throw lỗi ở đây để tránh làm hỏng luồng sinh phí chính
        }
    }

    return {
        count: result.count,
        periodName: period.tenKyThu,
        message: `Đã sinh thành công ${result.count} khoản phí.`
    };
};

exports.getExpiredCharges = async () => {
  return await chargeModel.getExpiredCharges();
}