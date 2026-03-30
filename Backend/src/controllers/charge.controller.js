const db = require("../config/db");
const chargeService = require("../services/charge.service");
const receiptService = require("../services/receipt.service");

exports.createCharge = async (req, res, next) => {
  try {
    const result = await chargeService.createCharge(req.body, req.user);
    res
      .status(201)
      .json({ message: "Charge created", charge_id: result.insertId });
  } catch (err) {
    next(err);
  }
};
exports.getChargesByPeriod = async (req, res, next) => {
  try {
    res.json(
      await chargeService.getChargesByPeriod(req.params.period_id, req.user),
    );
  } catch (err) {
    next(err);
  }
};
exports.getChargesById = async (req, res, next) => {
  try {
    res.json(
      await chargeService.getChargesById(req.params.id, req.user),
    );
  } catch (err) {
    next(err);
  }
};
exports.getChargesByMerchant = async (req, res, next) => {
  try {
    res.json(
      await chargeService.getChargesByMerchant(
        req.params.merchant_id,
        req.user,
      ),
    );
  } catch (err) {
    next(err);
  }
};
exports.updateChargeStatus = async (req, res, next) => {
  try {
    await chargeService.updateChargeStatus(req.params.id, req.body, req.user);
    res.json({ message: "Charge status updated" });
  } catch (err) {
    next(err);
  }
};
exports.updateDebtStatus = async (req, res, next) => {
  try {
    await chargeService.updateDebtStatus(req.params.id, req.body, req.user);
    res.json({ message: "Debt status updated" });
  } catch (err) {
    next(err);
  }
};
exports.getChargeHistory = async (req, res, next) => {
  try {
    res.json(await chargeService.getChargeHistory(req.params.id, req.user));
  } catch (err) {
    next(err);
  }
};

exports.listCharges = async (req, res, next) => {
  try {
    const where = ["c.tenant_id = ?"];
    const params = [req.user.tenant_id];
    if (req.query.period_id) {
      where.push("c.period_id = ?");
      params.push(req.query.period_id);
    }
    if (req.query.merchant_id) {
      where.push("c.merchant_id = ?");
      params.push(req.query.merchant_id);
    }
    if (req.query.trangThai) {
      where.push("c.trangThai = ?");
      params.push(req.query.trangThai);
    }
    if (req.query.q) {
      where.push("(k.maKiosk LIKE ? OR m.hoTen LIKE ?)");
      params.push(`%${req.query.q}%`, `%${req.query.q}%`);
    }
    const [[{ total }]] = await db.query(
      `SELECT COUNT(*) total FROM charge c LEFT JOIN kiosk k ON k.kiosk_id=c.kiosk_id AND k.tenant_id=c.tenant_id LEFT JOIN merchant m ON m.merchant_id=c.merchant_id AND m.tenant_id=c.tenant_id WHERE ${where.join(" AND ")}`,
      params,
    );
    const [rows] = await db.query(
      `SELECT c.*, k.maKiosk, m.hoTen AS merchantName, p.tenKyThu FROM charge c LEFT JOIN kiosk k ON k.kiosk_id=c.kiosk_id AND k.tenant_id=c.tenant_id LEFT JOIN merchant m ON m.merchant_id=c.merchant_id AND m.tenant_id=c.tenant_id LEFT JOIN collection_period p ON p.period_id=c.period_id AND p.tenant_id=c.tenant_id WHERE ${where.join(" AND ")} ORDER BY c.created_at DESC LIMIT ? OFFSET ?`,
      [...params, req.pagination.limit, req.pagination.offset],
    );
    res.json({
      data: rows,
      meta: {
        page: req.pagination.page,
        limit: req.pagination.limit,
        total,
        totalPages: Math.ceil(total / req.pagination.limit) || 0,
      },
    });
  } catch (err) {
    next(err);
  }
};

exports.getMyCharges = async (req, res, next) => {
  try {
    const where = ["c.tenant_id = ?"];
    const params = [req.user.tenant_id];
    if (req.query.period_id) {
      where.push("c.period_id = ?");
      params.push(req.query.period_id);
    }
    if (req.query.merchant_id) {
      where.push("c.merchant_id = ?");
      params.push(req.user.id);
    }
    if (req.query.trangThai) {
      where.push("c.trangThai = ?");
      params.push(req.query.trangThai);
    }
    if (req.query.q) {
      where.push("(k.maKiosk LIKE ? OR m.hoTen LIKE ?)");
      params.push(`%${req.query.q}%`, `%${req.query.q}%`);
    }
    const [[{ total }]] = await db.query(
      `SELECT COUNT(*) total FROM charge c LEFT JOIN kiosk k ON k.kiosk_id=c.kiosk_id AND k.tenant_id=c.tenant_id LEFT JOIN merchant m ON m.merchant_id=c.merchant_id AND m.tenant_id=c.tenant_id WHERE ${where.join(" AND ")}`,
      params,
    );
    const [rows] = await db.query(
      `SELECT c.*, k.maKiosk, m.hoTen AS merchantName, p.tenKyThu FROM charge c LEFT JOIN kiosk k ON k.kiosk_id=c.kiosk_id AND k.tenant_id=c.tenant_id LEFT JOIN merchant m ON m.merchant_id=c.merchant_id AND m.tenant_id=c.tenant_id LEFT JOIN collection_period p ON p.period_id=c.period_id AND p.tenant_id=c.tenant_id WHERE ${where.join(" AND ")} ORDER BY c.created_at DESC LIMIT ? OFFSET ?`,
      [...params, req.pagination.limit, req.pagination.offset],
    );
    res.json({
      data: rows,
      meta: {
        page: req.pagination.page,
        limit: req.pagination.limit,
        total,
        totalPages: Math.ceil(total / req.pagination.limit) || 0,
      },
    });
  } catch (err) {
    next(err);
  }
};
exports.createReceiptForCharge = async (req, res, next) => {
  try {
    const charge_id = Number(req.params.id || req.params.charge_id);
    const soTien = Number(req.body.soTien || req.body.soTienThu);
    console.log("charge_id:", charge_id);
    console.log("body:", req.body);
    const result = await receiptService.createReceipt(
      {
        soTienThu: soTien,
        hinhThucThanhToan: req.body.hinhThucThanhToan,
        ghiChu: req.body.ghiChu || null,
        anhChupThanhToan: req.body.anhChupThanhToan || null,
        thoiGianThu: req.body.thoiGianThu,
        shift_id: req.body.shift_id,
        charges: [{ charge_id, soTien }],
      },
      req.user,
    );
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
};

exports.generateCharges = async (req, res) => {
    try {
      console.log(req.user);
        const { period_id } = req.body;
        const { tenant_id } = req.user; // Giả sử tenant_id từ JWT middleware

        if (!period_id) {
            return res.status(400).json({ message: "Thiếu period_id" });
        }

        const result = await chargeService.generateChargesLogic(tenant_id, period_id);
        
        return res.status(201).json({
            success: true,
            ...result
        });

    } catch (error) {
        console.error("Generate Charge Error:", error);
        return res.status(error.statusCode || 500).json({ 
            message: error.message || "Lỗi máy chủ" 
        });
    }
};