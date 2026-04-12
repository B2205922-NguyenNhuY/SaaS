const paymentService = require("../services/payment.service");
const momoService = require('../services/momo.service');
const chargeService = require('../services/charge.service');
const auditLogModel = require("../models/auditLog.model");
const userModel = require("../models/users.model");
const receiptService = require("../services/receipt.service");
const debtService = require("../services/debt.service");
const db = require("../config/db");
const { logAudit } = require("../utils/audit");

exports.createPayment = async (req, res) => {
    try {
        const { chargeIds } = req.body;
        if (!chargeIds || chargeIds.length === 0) {
            return res.status(400).json({ message: "Chưa chọn khoản phí" });
        }
        const results = await Promise.all(
          chargeIds.map((c) => debtService.getDebtsByCharge(c, req.user))
        );
        const flattenedResults = results.flat();
        const totalAmount = flattenedResults.reduce((sum, item) => sum + parseFloat(item.amount), 0);
        const ngrokUrl = "https://sneakily-bronchitic-harriet.ngrok-free.dev";
        const payUrl = await momoService.generateMomoLink(req.user, chargeIds, totalAmount, ngrokUrl);


        res.json({ payUrl, chargeIds });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.momoWebhook = async (req, res) => {
    console.log("momoWebhook:", req.body.signature);

    if (!momoService.verifySignature(req.body)) {
        console.log("Invalid signature");
        return res.status(400).json({ message: "Invalid signature" });
    }
    const { orderId, resultCode, transId, message, amount, extraData } = req.body;
    console.log("IPN DATA:", req.body);
    console.log("User:", extraData);
    const decodedString = Buffer.from(extraData, "base64").toString();
    console.log("Chuỗi sau khi giải mã:", decodedString);
    const info = JSON.parse(
      Buffer.from(extraData, "base64").toString()
    );
    const { id, tenant_id, chargeIds } = info;
    
    console.log("Danh sách charges:", chargeIds);
    const charges = await Promise.all(
      chargeIds.map((c) =>
        debtService.getDebtsByCharge(c, {tenant_id})
      )
    );
    const flattenedCharges = charges.flat();
    console.log("Danh sách thông tin charges:", charges);
    const connection = await db.getConnection(); 

    try {
        await connection.beginTransaction();

        if (resultCode === 0) {
            console.log("Thanh toán thành công:", orderId);
            const totalExpected = flattenedCharges.reduce((sum, c) => sum + (parseFloat(c.amount) || 0), 0);

            if (Math.round(totalExpected) === Math.round(parseFloat(amount))) {
              const data = {
                  soTienThu: amount,
                  hinhThucThanhToan: "chuyen_khoan",
                  ghiChu: `Thanh_toan_${chargeIds.length}_khoan_phi`,
                  anhChupThanhToan: req.body.anhChupThanhToan || null,
                  thoiGianThu: new Date(),
                  shift_id: null,
                  charges: flattenedCharges,
                  transId: transId,
                }
                console.log(data);
              const result = await receiptService.createReceipt(data,info);
              if (result.affectedRows === 0) {
                  console.log("Hóa đơn đã được xử lý trước đó hoặc không tồn tại.");
              }
            } else {
                console.error("⚠️ Cảnh báo: Số tiền MoMo gửi về không khớp với tổng nợ tính toán!");
            }
        } else {
            await auditLogModel.createAuditLog(connection, {
              tenant_id: tenant_id,
              user_id: id,
              hanhDong: 'THANH_TOAN_THAT_BAI',
              entity_type: "charge",
              entity_id: chargeIds,
              giaTriMoi: JSON.stringify(req.body),
            });
        }

        await connection.commit();
        console.log("Transaction hoàn tất thành công.");
        
        return res.status(204).send();

    } catch (error) {
        await connection.rollback();
        console.error("Lỗi Webhook, đã Rollback dữ liệu:", error);
        return res.status(500).send();

    } finally {
        connection.release();
    }
};

exports.createCheckoutSession = async (req, res, next) => {
  try {
    const result = await paymentService.createCheckoutSession(
      req.user,
      req.body
    );

    await logAudit(req, {
      action: "THANH_TOAN",
      entity_type: "payment",
      entity_id: result.session_id,
      newValue: {
        ...req.body,
        session_id: result.session_id
      },
    });

    res.json({
      url: result.url,
      session_id: result.session_id
    });

  } catch (error) {
    next(error);
  }
};

exports.getPaymentHistory = async (req, res, next) => {
    try {
        const tenant_id = req.user.tenant_id;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        
        const result = await paymentService.getPaymentHistory(tenant_id, page, limit);
        
        res.json({
            data: result.data,
            pagination: result.pagination
        });
    } catch (error) {
        next(error);
    }
};

exports.getPaymentDetail = async (req, res, next) => {
    try {
        const { payment_id } = req.params;
        const tenant_id = req.user.tenant_id;
        
        const payment = await paymentService.getPaymentDetail(payment_id, tenant_id);
        
        if (!payment) {
            return res.status(404).json({ message: "Không tìm thấy thanh toán" });
        }
        
        res.json(payment);
    } catch (error) {
        next(error);
    }
};