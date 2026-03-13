const receiptModel = require("../models/receipt.model");
const chargeModel = require("../models/charge.model");
const auditLogModel = require("../models/auditLog.model");
const db = require("../config/database");


// Tạo receipt
exports.createReceipt = async (data, user) => {
    const connection = await db.getConnection();
    
    try {
        await connection.beginTransaction();

        console.log("Creating receipt with data:", {
            soTienThu: data.soTienThu,
            hinhThucThanhToan: data.hinhThucThanhToan,
            shift_id: data.shift_id,
            chargesCount: data.charges?.length || 0
        });

        if (!data.soTienThu || data.soTienThu <= 0) {
            throw new Error("Số tiền thu không hợp lệ");
        }
        
        if (!data.hinhThucThanhToan || !['tien_mat', 'chuyen_khoan'].includes(data.hinhThucThanhToan)) {
            throw new Error("Hình thức thanh toán không hợp lệ");
        }
        
        if (!data.charges || !Array.isArray(data.charges) || data.charges.length === 0) {
            throw new Error("Danh sách charges không hợp lệ");
        }

        const receipt = await receiptModel.createReceipt(
            connection,
            {
                tenant_id: user.tenant_id,
                soTienThu: data.soTienThu,
                hinhThucThanhToan: data.hinhThucThanhToan,
                ghiChu: data.ghiChu || null,
                anhChupThanhToan: data.anhChupThanhToan || null,
                thoiGianThu: data.thoiGianThu || new Date(),
                user_id: user.id,
                shift_id: data.shift_id || null
            }
        );

        const receipt_id = receipt.insertId;
        console.log("Receipt created with ID:", receipt_id);

        const totalChargesAmount = data.charges.reduce((sum, c) => sum + c.soTien, 0);
        if (Math.abs(totalChargesAmount - data.soTienThu) > 1000) { 
            console.warn("Total charges amount mismatch:", {
                receiptTotal: data.soTienThu,
                chargesTotal: totalChargesAmount
            });
        }

        for (const charge of data.charges) {

            if (!charge.charge_id || !charge.soTien || charge.soTien <= 0) {
                throw new Error(`Dữ liệu charge không hợp lệ: ${JSON.stringify(charge)}`);
            }

            const currentCharge = await chargeModel.getChargeById(
                user.tenant_id,
                charge.charge_id
            );

            if (!currentCharge) {
                throw new Error(`Charge ${charge.charge_id} không tồn tại`);
            }

            // Tính số tiền mới đã thu
            const newPaid = currentCharge.soTienDaThu + charge.soTien;
            
            const soTienPhaiThu = currentCharge.soTienPhaiThu;
            let safeNewPaid = Math.min(newPaid, soTienPhaiThu);
            
            let status = "no";
            if (safeNewPaid >= soTienPhaiThu - 0.01) {
                status = "da_thu";

                if (Math.abs(safeNewPaid - soTienPhaiThu) <= 0.01) {
                    safeNewPaid = soTienPhaiThu;
                }
            } else if (safeNewPaid > 0) {
                status = "no";
            }

            console.log(`Charge ${charge.charge_id} update:`, {
                soTienPhaiThu,
                soTienDaThu_cu: currentCharge.soTienDaThu,
                traThem: charge.soTien,
                newPaid,
                safeNewPaid,
                status
            });

            const soTienDaTraThucTe = safeNewPaid - currentCharge.soTienDaThu;

            if (soTienDaTraThucTe > 0) {
                await receiptModel.createReceiptCharge(
                    connection,
                    {
                        receipt_id,
                        charge_id: charge.charge_id,
                        tenant_id: user.tenant_id,
                        soTienDaTra: soTienDaTraThucTe
                    }
                );
            } else {
                console.log(`Charge ${charge.charge_id} đã được thanh toán đủ trước đó`);
            }
            
            await receiptModel.createReceiptCharge(
                connection,
                {
                    receipt_id,
                    charge_id: charge.charge_id,
                    tenant_id: user.tenant_id,
                    soTienDaTra: soTienDaTraThucTe  
                }
            );

            await chargeModel.updateDebtStatus(
                charge.charge_id,
                user.tenant_id,
                {
                    soTienDaThu: safeNewPaid,
                    trangThai: status
                },
                connection
            );

            console.log(`Charge ${charge.charge_id} updated:`, {
                newPaid,
                safeNewPaid,
                status
            });
        }

        await auditLogModel.createAuditLog(
            connection,
            {
                tenant_id: user.tenant_id,
                user_id: user.id,
                hanhDong: "CREATE_RECEIPT",
                entity_type: "receipt",
                entity_id: receipt_id,
                giaTriMoi: {
                    soTienThu: data.soTienThu,
                    hinhThucThanhToan: data.hinhThucThanhToan,
                    charges: data.charges,
                    ghiChu: data.ghiChu
                }
            }
        );

        await connection.commit();
        console.log("Transaction committed successfully");

        return {
            success: true,
            receipt_id,
            message: "Tạo biên lai thành công"
        };

    } catch (err) {
        await connection.rollback();
        console.error("Error in createReceipt:", err);
        throw err;

    } finally {
        connection.release();
    }
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