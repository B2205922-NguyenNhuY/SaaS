const receiptModel = require("../models/receipt.model");
const chargeModel = require("../models/charge.model");
const auditLogModel = require("../models/auditLog.model");
const userModel = require("../models/users.model");
const db = require("../config/db");

/**
 * TẠO BIÊN LAI THU PHÍ (RECEIPT)
 * Bao gồm: Tạo Receipt -> Tạo liên kết Receipt_Charge -> Cập nhật trạng thái Charge
 */
exports.createReceipt = async (data, user) => {
  console.log(data);
  if (!user) {
  throw Object.assign(new Error("User không tồn tại"), {
    statusCode: 404,
  });
}
  const connection = await db.getConnection();
  try {
    const tenant_id = user.tenant_id;
    await connection.beginTransaction();

    // 1. VALIDATION ĐẦU VÀO
    if (!data.soTienThu || data.soTienThu <= 0) {
      throw Object.assign(new Error("Số tiền thu không hợp lệ"), {
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

    // 2. KIỂM TRA SHIFT (CA LÀM VIỆC) - Tránh lỗi Foreign Key
    if(user.role === 'collector') {
      if (data.shift_id) {
        const [shiftExists] = await connection.execute(
          "SELECT shift_id FROM shift WHERE shift_id = ? AND tenant_id = ?",
          [data.shift_id, tenant_id],
        );
        if (shiftExists.length === 0) {
          throw Object.assign(
            new Error(
              "Ca làm việc không tồn tại hoặc không thuộc quyền quản lý của bạn",
            ),
            { statusCode: 400 },
          );
        }
      }
    }

    // 3. TẠO BIÊN LAI (RECEIPT) TRONG DB
    const receipt = await receiptModel.createReceipt(connection, {
      tenant_id: tenant_id,
      soTienThu: data.soTienThu,
      hinhThucThanhToan: data.hinhThucThanhToan,
      ghiChu: data.ghiChu || null,
      anhChupThanhToan: data.anhChupThanhToan || null,
      thoiGianThu: new Date(),
      user_id: user.id,
      shift_id: data.shift_id || null,
    });

    const receipt_id = receipt.insertId;

    // 4. XỬ LÝ CHI TIẾT TỪNG KHOẢN PHÍ THANH TOÁN
    for (const item of data.charges) {
      if (!item.charge_id || !item.amount || item.amount <= 0) {
        throw new Error(
          `Dữ liệu thanh toán cho charge ${item.charge_id} không hợp lệ`,
        );
      }

      // Lấy thông tin nợ hiện tại của Charge
      const currentCharge = await chargeModel.getChargesById(
        tenant_id,
        item.charge_id,
      );
      if (!currentCharge) {
        throw new Error(
          `Khoản phí ID ${item.charge_id} không tồn tại trong hệ thống`,
        );
      }
      console.log("receiptCharge", {
  receipt_id,
  charge_id: item.charge_id,
  tenant_id,
  soTienDaTra: item.amount
});
      // A. Tạo bản ghi liên kết (Bắt buộc để getDetail không bị NULL)
      await receiptModel.createReceiptCharge(connection, {
        receipt_id,
        charge_id: item.charge_id,
        tenant_id: tenant_id,
        soTienDaTra: item.amount, // Số tiền thực tế trả trong lần này
      });

      // B. Tính toán cộng dồn nợ trên bảng Charge
      const tongDaThuMoi =
        Number(currentCharge.soTienDaThu) + Number(item.amount);
      const soTienPhaiThu = Number(currentCharge.soTienPhaiThu);

      // Xác định trạng thái mới (da_thu nếu đã trả đủ, ngược lại là no)
      const trangThaiMoi =
        tongDaThuMoi >= soTienPhaiThu - 0.01 ? "da_thu" : "no";
console.log("updateCharge", {
  soTienDaThu: Math.min(tongDaThuMoi, soTienPhaiThu),
  trangThai: trangThaiMoi
});
      // C. Cập nhật bảng Charge (Truyền connection để chạy trong Transaction)
      await chargeModel.updateDebtStatus(
        item.charge_id,
        tenant_id,
        {
          soTienDaThu: Math.min(tongDaThuMoi, soTienPhaiThu), // Không cho phép thu vượt quá số phải thu
          trangThai: trangThaiMoi,
        },
        connection,
      );
    }
console.log("auditLog", {
  tenant_id,
  user_id: user.id,
  entity_id: receipt_id
});
    // 5. GHI LOG HỆ THỐNG
    await auditLogModel.createAuditLog(connection, {
      tenant_id: tenant_id,
      merchant_id: user.id,
      hanhDong: "THANH_TOAN_THANH_CONG",
      entity_type: "receipt",
      entity_id: receipt_id,
      giaTriMoi: {
        receipt_id,
        total: data.soTienThu,
        charges: data.charges,
        transId: data.transId || null,
      },
    });

    await connection.commit();
    return {
      success: true,
      receipt_id,
      message: "Tạo biên lai và cập nhật công nợ thành công",
    };
  } catch (err) {
    await connection.rollback();
    // Bắt lỗi MySQL Foreign Key để trả về thông báo dễ hiểu
    if (err.code === "ER_NO_REFERENCED_ROW_2") {
      if (err.message.includes("fk_receipt_shift"))
        err.message = "Ca làm việc không hợp lệ";
      if (err.message.includes("fk_rc_charge"))
        err.message = "Khoản phí không tồn tại";
    }
    throw err;
  } finally {
    connection.release();
  }
};

/**
 * LẤY DANH SÁCH BIÊN LAI (CÓ PHÂN TRANG)
 */
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

exports.getMyReceipts = async (user, pagination, query = {}) => {
  const where = ["r.tenant_id = ? AND r.merchant_id = ?"];
  const params = [user.tenant_id, user.id];

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

/**
 * LẤY CHI TIẾT BIÊN LAI KÈM DANH SÁCH CÁC KHOẢN PHÍ ĐÃ TRẢ
 */
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

  // Map danh sách charges, loại bỏ các dòng null do JOIN nếu có
  const charges = rows
    .filter((r) => r.charge_id !== null)
    .map((r) => ({
      charge_id: r.charge_id,
      kiosk: r.maKiosk,
      merchant: r.merchant,
      kyThu: r.tenKyThu,
      bieuPhi: r.tenBieuPhi,
      soTienPhaiThu: r.soTienPhaiThu,
      soTienDaTra: r.soTienDaTra, // Số tiền của riêng lần thanh toán này
    }));

  return {
    receipt: receiptInfo,
    charges: charges,
  };
};
