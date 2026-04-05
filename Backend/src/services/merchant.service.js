const db     = require("../config/db");
const bcrypt = require("bcrypt");
const { isDuplicateKey } = require("../services/_dbErrors");
const M = require("../models/merchant.model");

function isValidPhone(phone) {
  if (!phone) return true;
  return /^(0|\+84)\d{8,10}$/.test(String(phone));
}

function isValidDateOnly(v) {
  if (!v) return true;
  return /^\d{4}-\d{2}-\d{2}$/.test(String(v));
}

exports.create = async (tenant_id, body) => {
  const hoTen                = String(body.hoTen || "").trim();
  const CCCD                 = String(body.CCCD  || "").trim();
  const soDienThoai          = body.soDienThoai          ?? null;
  const maSoThue             = body.maSoThue             ?? null;
  const diaChiThuongTru      = body.diaChiThuongTru      ?? null;
  const ngayThamGiaKinhDoanh = body.ngayThamGiaKinhDoanh ?? null;
  const plainPassword        = String(body.password || "123456");

  if (!hoTen) throw Object.assign(new Error("hoTen is required"), { statusCode: 400 });
  if (CCCD.length !== 12) throw Object.assign(new Error("CCCD must be 12 characters"), { statusCode: 400 });
  if (!isValidPhone(soDienThoai)) throw Object.assign(new Error("Invalid soDienThoai"), { statusCode: 400 });
  if (!isValidDateOnly(ngayThamGiaKinhDoanh)) throw Object.assign(new Error("ngayThamGiaKinhDoanh must be YYYY-MM-DD"), { statusCode: 400 });

  const password_hash = await bcrypt.hash(plainPassword, 10);
  const conn = await db.getConnection();

  try {
    await conn.beginTransaction();

    const merchant_id = await M.insert(conn, {
      tenant_id, password_hash, hoTen, soDienThoai,
      CCCD, maSoThue, diaChiThuongTru, ngayThamGiaKinhDoanh,
    });

    await conn.commit();
    return { merchant_id, tenant_id, hoTen, CCCD, soDienThoai, trangThai: "active" };
  } catch (e) {
    await conn.rollback();
    if (isDuplicateKey(e)) throw Object.assign(new Error("CCCD already exists in this tenant"), { statusCode: 409 });
    throw e;
  } finally {
    conn.release();
  }
};

exports.update = async (tenant_id, merchant_id, body) => {
  const conn = await db.getConnection();

  try {
    await conn.beginTransaction();

    const current = await M.getByIdWithConn(conn, tenant_id, merchant_id);
    if (!current) throw Object.assign(new Error("Merchant not found"), { statusCode: 404 });

    const hoTen                = body.hoTen                !== undefined ? String(body.hoTen || "").trim() : current.hoTen;
    const soDienThoai          = body.soDienThoai          !== undefined ? body.soDienThoai                : current.soDienThoai;
    const CCCD                 = body.CCCD                 !== undefined ? String(body.CCCD  || "").trim() : current.CCCD;
    const maSoThue             = body.maSoThue             !== undefined ? body.maSoThue                   : current.maSoThue;
    const diaChiThuongTru      = body.diaChiThuongTru      !== undefined ? body.diaChiThuongTru            : current.diaChiThuongTru;
    const ngayThamGiaKinhDoanh = body.ngayThamGiaKinhDoanh !== undefined ? body.ngayThamGiaKinhDoanh       : current.ngayThamGiaKinhDoanh;
    const trangThai            = body.trangThai            !== undefined ? body.trangThai                  : current.trangThai;

    if (!hoTen) throw Object.assign(new Error("hoTen is required"), { statusCode: 400 });
    if (CCCD.length !== 12) throw Object.assign(new Error("CCCD must be 12 characters"), { statusCode: 400 });
    if (!["active", "inactive"].includes(trangThai)) throw Object.assign(new Error("Invalid trangThai"), { statusCode: 400 });
    if (!isValidPhone(soDienThoai)) throw Object.assign(new Error("Invalid soDienThoai"), { statusCode: 400 });
    if (!isValidDateOnly(ngayThamGiaKinhDoanh)) throw Object.assign(new Error("ngayThamGiaKinhDoanh must be YYYY-MM-DD"), { statusCode: 400 });

    if (CCCD !== current.CCCD) {
      if (await M.hasAnyCharge(conn, tenant_id, merchant_id))
        throw Object.assign(new Error("Không thể đổi CCCD vì tiểu thương đã phát sinh khoản thu"), { statusCode: 409 });
    }

    if (current.trangThai !== "inactive" && trangThai === "inactive") {
      if (await M.hasActiveAssignment(conn, tenant_id, merchant_id))
        throw Object.assign(new Error("Không thể khóa tiểu thương vì còn kiosk đang được gán"), { statusCode: 409 });
      if (await M.hasOutstandingDebt(conn, tenant_id, merchant_id))
        throw Object.assign(new Error("Không thể khóa tiểu thương vì vẫn còn công nợ"), { statusCode: 409 });
    }

    await M.updateInfo(conn, tenant_id, merchant_id, {
      hoTen, soDienThoai, CCCD, maSoThue, diaChiThuongTru, ngayThamGiaKinhDoanh, trangThai,
    });

    await conn.commit();
    return { ok: true };
  } catch (e) {
    await conn.rollback();
    if (isDuplicateKey(e)) throw Object.assign(new Error("CCCD already exists in this tenant"), { statusCode: 409 });
    throw e;
  } finally {
    conn.release();
  }
};

exports.updateStatus = async (tenant_id, merchant_id, trangThai) => {
  if (!["active", "inactive"].includes(trangThai))
    throw Object.assign(new Error("Trạng thái không hợp lệ"), { statusCode: 400 });

  const conn = await db.getConnection();

  try {
    await conn.beginTransaction();

    const current = await M.getByIdWithConn(conn, tenant_id, merchant_id);
    if (!current) throw Object.assign(new Error("Không tìm thấy tiểu thương"), { statusCode: 404 });

    if (current.trangThai !== "inactive" && trangThai === "inactive") {
      if (await M.hasActiveAssignment(conn, tenant_id, merchant_id))
        throw Object.assign(new Error("Không thể khóa tiểu thương vì còn kiosk đang được gán"), { statusCode: 409 });
      if (await M.hasOutstandingDebt(conn, tenant_id, merchant_id))
        throw Object.assign(new Error("Không thể khóa tiểu thương vì vẫn còn công nợ"), { statusCode: 409 });
    }

    await M.updateStatus(conn, tenant_id, merchant_id, trangThai);

    const updated = await M.getByIdWithConn(conn, tenant_id, merchant_id);
    await conn.commit();
    return updated;
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
};

exports.updatePassword = async (tenant_id, merchant_id, newPassword) => {
  if (!newPassword || newPassword.length < 6)
    throw Object.assign(new Error("Mật khẩu phải ít nhất 6 ký tự"), { statusCode: 400 });

  const merchant = await M.getById(tenant_id, merchant_id);
  if (!merchant) throw Object.assign(new Error("Merchant not found"), { statusCode: 404 });

  const password_hash = await bcrypt.hash(newPassword, 10);
  await M.updatePassword(tenant_id, merchant_id, password_hash);
  return { ok: true };
};

exports.list = async (tenant_id, filters, pg) => {
  return M.list(tenant_id, filters, pg);
};

exports.detail = async (tenant_id, merchant_id) => {
  const merchant = await M.getById(tenant_id, merchant_id);
  if (!merchant) throw Object.assign(new Error("Merchant not found"), { statusCode: 404 });
  const active_assignments = await M.getActiveAssignments(tenant_id, merchant_id);
  return { ...merchant, active_assignments };
};

exports.getById = async (tenant_id, merchant_id) => {
  const merchant = await M.getById(tenant_id, merchant_id);
  if (!merchant) throw Object.assign(new Error("Merchant not found"), { statusCode: 404 });
  return merchant;
};