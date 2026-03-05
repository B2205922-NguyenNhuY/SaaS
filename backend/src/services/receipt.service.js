const receiptModel = require("../models/receipt.model");
const chargeModel = require("../models/charge.model");
const auditLogModel = require("../models/auditLog.model");


// Tạo receipt
exports.createReceipt = async (data, user) => {

    const receipt = await receiptModel.createReceipt({
        tenant_id: user.tenant_id,
        soTienThu: data.soTienThu,
        hinhThucThanhToan: data.hinhThucThanhToan,
        ghiChu: data.ghiChu,
        anhChupThanhToan: data.anhChupThanhToan,
        thoiGianThu: data.thoiGianThu,
        user_id: user.id,
        shift_id: data.shift_id
    });

    const receipt_id = receipt.insertId;


    for (const charge of data.charges) {

        await receiptModel.createReceiptCharge({
            receipt_id,
            charge_id: charge.charge_id,
            tenant_id: user.tenant_id,
            soTienDaTra: charge.soTien
        });

        await chargeModel.updateChargeStatus(
            charge.charge_id,
            user.tenant_id,
            "da_thu"
        );
    }


    await auditLogModel.createAuditLog({
        tenant_id: user.tenant_id,
        user_id: user.id,
        hanhDong: "CREATE_RECEIPT",
        entity_type: "receipt",
        entity_id: receipt_id,
        giaTriMoi: data
    });


    return receipt;
};


// Lấy danh sách receipt
exports.getReceipts = async (user) => {

    return await receiptModel.getReceiptsByTenant(
        user.tenant_id
    );
};


// Lấy chi tiết receipt
exports.getReceiptDetail = async (receipt_id, user) => {

    const rows = await receiptModel.getReceiptDetail(
        receipt_id,
        user.tenant_id
    );

    if (!rows.length) {
        throw new Error("Receipt not found");
    }

    const receiptInfo = {
        receipt_id: rows[0].receipt_id,
        soTienThu: rows[0].soTienThu,
        hinhThucThanhToan: rows[0].hinhThucThanhToan,
        ghiChu: rows[0].ghiChu,
        anhChupThanhToan: rows[0].anhChupThanhToan,
        thoiGianThu: rows[0].thoiGianThu,
        nhanVienThu: rows[0].nhanVienThu
    };

    const charges = rows.map(r => ({
        charge_id: r.charge_id,
        kiosk: r.maKiosk,
        merchant: r.merchant,
        kyThu: r.tenKyThu,
        bieuPhi: r.tenBieuPhi,
        soTienPhaiThu: r.soTienPhaiThu,
        soTienDaTra: r.soTienDaTra
    }));

    return {
        receipt: receiptInfo,
        charges
    };
};