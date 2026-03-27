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
      params.push(Number(req.query.period_id));
    }

    if (req.query.merchant_id) {
      where.push("c.merchant_id = ?");
      params.push(Number(req.query.merchant_id));
    }

    if (req.query.trangThai) {
      where.push("c.trangThai = ?");
      params.push(req.query.trangThai);
    }

    if (req.query.zone_id) {
      where.push("k.zone_id = ?");
      params.push(Number(req.query.zone_id));
    }

    if (req.query.market_id) {
      where.push("z.market_id = ?");
      params.push(Number(req.query.market_id));
    }

    if (String(req.query.only_unpaid || "") === "1") {
      where.push("c.trangThai IN ('chua_thu', 'no')");
    }

    if (req.query.q) {
      where.push("(k.maKiosk LIKE ? OR me.hoTen LIKE ?)");
      params.push(`%${req.query.q}%`, `%${req.query.q}%`);
    }

    const baseJoin = `
      FROM charge c
      LEFT JOIN kiosk k
        ON k.kiosk_id = c.kiosk_id
       AND k.tenant_id = c.tenant_id
      LEFT JOIN zone z
        ON z.zone_id = k.zone_id
       AND z.tenant_id = k.tenant_id
      LEFT JOIN market mk
        ON mk.market_id = z.market_id
       AND mk.tenant_id = z.tenant_id
      LEFT JOIN merchant me
        ON me.merchant_id = c.merchant_id
       AND me.tenant_id = c.tenant_id
      LEFT JOIN collection_period p
        ON p.period_id = c.period_id
       AND p.tenant_id = c.tenant_id
    `;

    const [[{ total }]] = await db.query(
      `SELECT COUNT(*) AS total
       ${baseJoin}
       WHERE ${where.join(" AND ")}`,
      params,
    );

    const [rows] = await db.query(
      `SELECT
          c.*,
          (c.soTienPhaiThu - c.soTienDaThu) AS soTienConLai,
          k.maKiosk,
          k.zone_id,
          z.tenKhu,
          z.market_id,
          mk.tenCho,
          me.hoTen AS merchantName,
          p.tenKyThu
        ${baseJoin}
        WHERE ${where.join(" AND ")}
        ORDER BY c.created_at DESC
        LIMIT ? OFFSET ?`,
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

    const uploadedImagePath = req.file
      ? `/uploads/receipts/${req.file.filename}`
      : req.body.anhChupThanhToan || null;

    const result = await receiptService.createReceipt(
      {
        soTienThu: soTien,
        hinhThucThanhToan: req.body.hinhThucThanhToan,
        ghiChu: req.body.ghiChu || null,
        anhChupThanhToan: uploadedImagePath,
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
