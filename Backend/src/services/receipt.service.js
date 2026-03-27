const receiptModel = require("../models/receipt.model");
const chargeModel = require("../models/charge.model");
const shiftModel = require("../models/shift.model");
const auditLogModel = require("../models/auditLog.model");
const db = require("../config/db");

exports.createReceipt = async (data, user) => {
  const connection = await db.getConnection();

  try {
    const tenant_id = user.tenant_id;
    await connection.beginTransaction();

    if (!data.soTienThu || data.soTienThu <= 0) {
      throw Object.assign(new Error("Số tiền thu không hợp lệ"), {
        statusCode: 400,
      });
    }
    if (data.hinhThucThanhToan === "chuyen_khoan" && !data.anhChupThanhToan) {
      throw Object.assign(new Error("Chuyển khoản phải có ảnh xác nhận"), {
        statusCode: 400,
      });
    }

    if (
      data.hinhThucThanhToan !== "tien_mat" &&
      data.hinhThucThanhToan !== "chuyen_khoan"
    ) {
      throw Object.assign(new Error("Hình thức thanh toán không hợp lệ"), {
        statusCode: 400,
      });
    }

    if (
      !data.charges ||
      !Array.isArray(data.charges) ||
      data.charges.length === 0
    ) {
      throw Object.assign(
        new Error("Danh sách khoản phí (charges) không hợp lệ"),
        { statusCode: 400 },
      );
    }

    const activeShift = await shiftModel.getActiveShift(user.id, tenant_id);
    if (!activeShift) {
      throw Object.assign(new Error("Bạn phải mở ca trước khi thu phí"), {
        statusCode: 400,
      });
    }

    if (
      !data.shift_id ||
      Number(data.shift_id) !== Number(activeShift.shift_id)
    ) {
      throw Object.assign(new Error("Ca thu không hợp lệ"), {
        statusCode: 400,
      });
    }

    const receipt = await receiptModel.createReceipt(connection, {
      tenant_id: tenant_id,
      soTienThu: data.soTienThu,
      hinhThucThanhToan: data.hinhThucThanhToan,
      ghiChu: data.ghiChu || null,
      anhChupThanhToan: data.anhChupThanhToan || null,
      thoiGianThu: data.thoiGianThu || new Date(),
      user_id: user.id,
      shift_id: data.shift_id,
    });

    const receipt_id = receipt.insertId;

    for (const item of data.charges) {
      if (!item.charge_id || !item.soTien || item.soTien <= 0) {
        throw new Error(
          `Dữ liệu thanh toán cho charge ${item.charge_id} không hợp lệ`,
        );
      }

      const currentCharge = await chargeModel.getChargeById(
        tenant_id,
        item.charge_id,
      );
      if (!currentCharge) {
        throw new Error(
          `Khoản phí ID ${item.charge_id} không tồn tại trong hệ thống`,
        );
      }

      await receiptModel.createReceiptCharge(connection, {
        receipt_id,
        charge_id: item.charge_id,
        tenant_id: tenant_id,
        soTienDaTra: item.soTien,
      });

      const tongDaThuMoi =
        Number(currentCharge.soTienDaThu) + Number(item.soTien);
      const soTienPhaiThu = Number(currentCharge.soTienPhaiThu);
      const trangThaiMoi =
        tongDaThuMoi >= soTienPhaiThu - 0.01 ? "da_thu" : "no";

      await chargeModel.updateDebtStatus(
        item.charge_id,
        tenant_id,
        {
          soTienDaThu: Math.min(tongDaThuMoi, soTienPhaiThu),
          trangThai: trangThaiMoi,
        },
        connection,
      );
    }

    await auditLogModel.createAuditLog(connection, {
      tenant_id: tenant_id,
      user_id: user.id,
      hanhDong: "CREATE_RECEIPT",
      entity_type: "receipt",
      entity_id: receipt_id,
      giaTriMoi: {
        receipt_id,
        total: data.soTienThu,
        charges: data.charges,
      },
    });
    if (data.shift_id) {
      const [[totals]] = await connection.query(
        `SELECT
       COALESCE(SUM(CASE WHEN hinhThucThanhToan = 'tien_mat' THEN soTienThu ELSE 0 END), 0) AS tienMat,
       COALESCE(SUM(CASE WHEN hinhThucThanhToan = 'chuyen_khoan' THEN soTienThu ELSE 0 END), 0) AS chuyenKhoan
     FROM receipt
     WHERE shift_id = ? AND tenant_id = ?`,
        [data.shift_id, tenant_id],
      );

      await connection.query(
        `UPDATE shift
        SET tongTienMatThuDuoc = ?,
            tongChuyenKhoanThuDuoc = ?
      WHERE shift_id = ? AND tenant_id = ?`,
        [totals.tienMat, totals.chuyenKhoan, data.shift_id, tenant_id],
      );
    }
    await connection.commit();
    return {
      success: true,
      receipt_id,
      message: "Tạo biên lai và cập nhật công nợ thành công",
    };
  } catch (err) {
    await connection.rollback();
    if (err.code === "ER_NO_REFERENCED_ROW_2") {
      if (err.message.includes("fk_receipt_shift")) {
        err.message = "Ca làm việc không hợp lệ";
      }
      if (err.message.includes("fk_rc_charge")) {
        err.message = "Khoản phí không tồn tại";
      }
    }
    throw err;
  } finally {
    connection.release();
  }
};

exports.getReceipts = async (user, pagination, query = {}) => {
  const where = ["r.tenant_id = ?"];
  const params = [user.tenant_id];

  if (query.hinhThucThanhToan) {
    where.push("r.hinhThucThanhToan = ?");
    params.push(query.hinhThucThanhToan);
  }

  const [[{ total }]] = await db.query(
    `SELECT COUNT(*) total FROM receipt r WHERE ${where.join(" AND ")}`,
    params,
  );

  const [rows] = await db.query(
    `SELECT r.* FROM receipt r 
     WHERE ${where.join(" AND ")} 
     ORDER BY r.thoiGianThu DESC 
     LIMIT ? OFFSET ?`,
    [...params, pagination.limit, pagination.offset],
  );

  return {
    data: rows,
    meta: {
      page: pagination.page,
      limit: pagination.limit,
      total,
      totalPages: Math.ceil(total / pagination.limit) || 0,
    },
  };
};

exports.getReceiptDetail = async (receipt_id, user) => {
  const rows = await receiptModel.getReceiptDetail(receipt_id, user.tenant_id);

  if (!rows || rows.length === 0) {
    throw Object.assign(new Error("Không tìm thấy biên lai này"), {
      statusCode: 404,
    });
  }

  const receiptInfo = {
    receipt_id: rows[0].receipt_id,
    soTienThu: rows[0].soTienThu,
    hinhThucThanhToan: rows[0].hinhThucThanhToan,
    ghiChu: rows[0].ghiChu,
    anhChupThanhToan: rows[0].anhChupThanhToan,
    thoiGianThu: rows[0].thoiGianThu,
    nhanVienThu: rows[0].nhanVienThu,
  };

  const charges = rows
    .filter((r) => r.charge_id !== null)
    .map((r) => ({
      charge_id: r.charge_id,
      kiosk: r.maKiosk,
      merchant: r.merchant,
      kyThu: r.tenKyThu,
      bieuPhi: r.tenBieuPhi,
      soTienPhaiThu: r.soTienPhaiThu,
      soTienDaTra: r.soTienDaTra,
    }));

  return {
    receipt: receiptInfo,
    charges: charges,
  };
};
