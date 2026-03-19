const db = require("../config/db");
const bcrypt = require("bcrypt");
const { isDuplicateKey } = require("./_dbErrors");

const ALLOWED_SORT = new Set([
  "created_at",
  "updated_at",
  "merchant_id",
  "hoTen",
  "soDienThoai",
  "trangThai",
]);

const pickSort = (s) => (ALLOWED_SORT.has(s) ? s : "created_at");

function isValidPhone(phone) {
  if (!phone) return true;
  return /^(0|\+84)\d{8,10}$/.test(String(phone));
}

function isValidDateOnly(v) {
  if (!v) return true;
  return /^\d{4}-\d{2}-\d{2}$/.test(String(v));
}

async function getMerchantRaw(tenant_id, merchant_id) {
  const [rows] = await db.query(
    `SELECT * FROM merchant WHERE tenant_id = ? AND merchant_id = ? LIMIT 1`,
    [tenant_id, merchant_id],
  );
  return rows[0] || null;
}

async function hasOutstandingDebt(connection, tenant_id, merchant_id) {
  const [rows] = await connection.execute(
    `
    SELECT 1
    FROM charge
    WHERE tenant_id = ?
      AND merchant_id = ?
      AND trangThai IN ('chua_thu', 'no')
    LIMIT 1
    `,
    [tenant_id, merchant_id],
  );
  return rows.length > 0;
}

async function hasActiveAssignment(connection, tenant_id, merchant_id) {
  const [rows] = await connection.execute(
    `
    SELECT 1
    FROM kiosk_assignment
    WHERE tenant_id = ?
      AND merchant_id = ?
      AND trangThai = 'active'
    LIMIT 1
    `,
    [tenant_id, merchant_id],
  );
  return rows.length > 0;
}

async function hasAnyCharge(connection, tenant_id, merchant_id) {
  const [rows] = await connection.execute(
    `
    SELECT 1
    FROM charge
    WHERE tenant_id = ?
      AND merchant_id = ?
    LIMIT 1
    `,
    [tenant_id, merchant_id],
  );
  return rows.length > 0;
}

exports.create = async (tenant_id, body) => {
  const hoTen = String(body.hoTen || "").trim();
  const CCCD = String(body.CCCD || "").trim();
  const soDienThoai = body.soDienThoai ?? null;
  const maSoThue = body.maSoThue ?? null;
  const diaChiThuongTru = body.diaChiThuongTru ?? null;
  const ngayThamGiaKinhDoanh = body.ngayThamGiaKinhDoanh ?? null;
  const plainPassword = String(body.password || "123456");

  if (!hoTen) {
    throw Object.assign(new Error("hoTen is required"), { statusCode: 400 });
  }

  if (CCCD.length !== 12) {
    throw Object.assign(new Error("CCCD must be 12 characters"), {
      statusCode: 400,
    });
  }

  if (!isValidPhone(soDienThoai)) {
    throw Object.assign(new Error("Invalid soDienThoai"), {
      statusCode: 400,
    });
  }

  if (!isValidDateOnly(ngayThamGiaKinhDoanh)) {
    throw Object.assign(new Error("ngayThamGiaKinhDoanh must be YYYY-MM-DD"), {
      statusCode: 400,
    });
  }

  const password_hash = await bcrypt.hash(plainPassword, 10);

  try {
    const [r] = await db.query(
      `INSERT INTO merchant (
        tenant_id, password_hash, hoTen, soDienThoai, CCCD, maSoThue,
        diaChiThuongTru, ngayThamGiaKinhDoanh, trangThai
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active')`,
      [
        tenant_id,
        password_hash,
        hoTen,
        soDienThoai,
        CCCD,
        maSoThue,
        diaChiThuongTru,
        ngayThamGiaKinhDoanh,
      ],
    );

    return {
      merchant_id: r.insertId,
      tenant_id,
      hoTen,
      CCCD,
      soDienThoai,
      trangThai: "active",
    };
  } catch (e) {
    if (isDuplicateKey(e)) {
      throw Object.assign(new Error("CCCD already exists in this tenant"), {
        statusCode: 409,
      });
    }
    throw e;
  }
};

exports.update = async (tenant_id, merchant_id, body) => {
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const [currentRows] = await connection.execute(
      `SELECT * FROM merchant WHERE tenant_id = ? AND merchant_id = ? LIMIT 1`,
      [tenant_id, merchant_id],
    );

    const current = currentRows[0];

    if (!current) {
      throw Object.assign(new Error("Merchant not found"), { statusCode: 404 });
    }

    const hoTen =
      body.hoTen !== undefined
        ? String(body.hoTen || "").trim()
        : current.hoTen;

    const soDienThoai =
      body.soDienThoai !== undefined ? body.soDienThoai : current.soDienThoai;

    const CCCD =
      body.CCCD !== undefined ? String(body.CCCD || "").trim() : current.CCCD;

    const maSoThue =
      body.maSoThue !== undefined ? body.maSoThue : current.maSoThue;

    const diaChiThuongTru =
      body.diaChiThuongTru !== undefined
        ? body.diaChiThuongTru
        : current.diaChiThuongTru;

    const ngayThamGiaKinhDoanh =
      body.ngayThamGiaKinhDoanh !== undefined
        ? body.ngayThamGiaKinhDoanh
        : current.ngayThamGiaKinhDoanh;

    const trangThai =
      body.trangThai !== undefined ? body.trangThai : current.trangThai;

    if (!hoTen) {
      throw Object.assign(new Error("hoTen is required"), { statusCode: 400 });
    }

    if (CCCD.length !== 12) {
      throw Object.assign(new Error("CCCD must be 12 characters"), {
        statusCode: 400,
      });
    }

    if (!["active", "inactive"].includes(trangThai)) {
      throw Object.assign(new Error("Invalid trangThai"), {
        statusCode: 400,
      });
    }

    if (!isValidPhone(soDienThoai)) {
      throw Object.assign(new Error("Invalid soDienThoai"), {
        statusCode: 400,
      });
    }

    if (!isValidDateOnly(ngayThamGiaKinhDoanh)) {
      throw Object.assign(
        new Error("ngayThamGiaKinhDoanh must be YYYY-MM-DD"),
        { statusCode: 400 },
      );
    }

    const isCCCDChanged = CCCD !== current.CCCD;
    if (isCCCDChanged) {
      const charged = await hasAnyCharge(connection, tenant_id, merchant_id);
      if (charged) {
        throw Object.assign(
          new Error("Không thể đổi CCCD vì tiểu thương đã phát sinh khoản thu"),
          { statusCode: 409 },
        );
      }
    }

    const goingInactive =
      current.trangThai !== "inactive" && trangThai === "inactive";

    if (goingInactive) {
      const activeAssignment = await hasActiveAssignment(
        connection,
        tenant_id,
        merchant_id,
      );

      if (activeAssignment) {
        throw Object.assign(
          new Error("Không thể khóa tiểu thương vì còn kiosk đang được gán"),
          { statusCode: 409 },
        );
      }

      const outstanding = await hasOutstandingDebt(
        connection,
        tenant_id,
        merchant_id,
      );

      if (outstanding) {
        throw Object.assign(
          new Error("Không thể khóa tiểu thương vì vẫn còn công nợ"),
          { statusCode: 409 },
        );
      }
    }

    await connection.execute(
      `UPDATE merchant
          SET hoTen = ?, soDienThoai = ?, CCCD = ?, maSoThue = ?, diaChiThuongTru = ?,
              ngayThamGiaKinhDoanh = ?, trangThai = ?,
              inactive_at = CASE
                WHEN ? = 'inactive' THEN NOW()
                WHEN ? = 'active' THEN NULL
                ELSE inactive_at
              END,
              updated_at = NOW()
        WHERE tenant_id = ? AND merchant_id = ?`,
      [
        hoTen,
        soDienThoai,
        CCCD,
        maSoThue,
        diaChiThuongTru,
        ngayThamGiaKinhDoanh,
        trangThai,
        trangThai,
        trangThai,
        tenant_id,
        merchant_id,
      ],
    );

    await connection.commit();
    return { ok: true };
  } catch (e) {
    await connection.rollback();

    if (isDuplicateKey(e)) {
      throw Object.assign(new Error("CCCD already exists in this tenant"), {
        statusCode: 409,
      });
    }

    throw e;
  } finally {
    connection.release();
  }
};

exports.list = async (tenant_id, filters, pg) => {
  const where = ["m.tenant_id = ?"];
  const params = [tenant_id];

  if (filters.trangThai) {
    where.push("m.trangThai = ?");
    params.push(filters.trangThai);
  }

  if (filters.soDienThoai) {
    where.push("m.soDienThoai = ?");
    params.push(filters.soDienThoai);
  }

  if (filters.CCCD) {
    where.push("m.CCCD = ?");
    params.push(filters.CCCD);
  }

  if (filters.maSoThue) {
    where.push("m.maSoThue = ?");
    params.push(filters.maSoThue);
  }

  if (filters.has_active_assignment === "true") {
    where.push(`
      EXISTS (
        SELECT 1
        FROM kiosk_assignment ka
        WHERE ka.tenant_id = m.tenant_id
          AND ka.merchant_id = m.merchant_id
          AND ka.trangThai = 'active'
      )
    `);
  }

  if (filters.has_active_assignment === "false") {
    where.push(`
      NOT EXISTS (
        SELECT 1
        FROM kiosk_assignment ka
        WHERE ka.tenant_id = m.tenant_id
          AND ka.merchant_id = m.merchant_id
          AND ka.trangThai = 'active'
      )
    `);
  }

  if (filters.q) {
    where.push(
      "(m.hoTen LIKE ? OR m.CCCD LIKE ? OR m.maSoThue LIKE ? OR m.soDienThoai LIKE ?)",
    );
    params.push(
      `%${filters.q}%`,
      `%${filters.q}%`,
      `%${filters.q}%`,
      `%${filters.q}%`,
    );
  }

  const sort = pickSort(pg.sort);
  const order =
    String(pg.order || "DESC").toUpperCase() === "ASC" ? "ASC" : "DESC";

  const [[{ total }]] = await db.query(
    `SELECT COUNT(*) AS total
     FROM merchant m
     WHERE ${where.join(" AND ")}`,
    params,
  );

  const [rows] = await db.query(
    `SELECT m.*
     FROM merchant m
     WHERE ${where.join(" AND ")}
     ORDER BY m.${sort} ${order}
     LIMIT ? OFFSET ?`,
    [...params, pg.limit, pg.offset],
  );

  return {
    data: rows,
    meta: {
      page: pg.page,
      limit: pg.limit,
      total,
      totalPages: Math.ceil(total / pg.limit),
    },
  };
};

exports.detail = async (tenant_id, merchant_id) => {
  const merchant = await getMerchantRaw(tenant_id, merchant_id);

  if (!merchant) {
    throw Object.assign(new Error("Merchant not found"), { statusCode: 404 });
  }

  const [assign] = await db.query(
    `SELECT ka.assignment_id, ka.ngayBatDau, ka.ngayKetThuc, ka.trangThai,
            k.kiosk_id, k.maKiosk, k.viTri, k.trangThai AS kioskTrangThai,
            z.zone_id, z.tenKhu, m.market_id, m.tenCho
     FROM kiosk_assignment ka
     JOIN kiosk k ON k.kiosk_id = ka.kiosk_id AND k.tenant_id = ka.tenant_id
     JOIN zone z ON z.zone_id = k.zone_id AND z.tenant_id = k.tenant_id
     JOIN market m ON m.market_id = z.market_id AND m.tenant_id = z.tenant_id
     WHERE ka.tenant_id = ? AND ka.merchant_id = ? AND ka.trangThai = 'active'
     ORDER BY ka.ngayBatDau DESC`,
    [tenant_id, merchant_id],
  );

  return { ...merchant, active_assignments: assign };
};

exports.updateStatus = async (merchant_id, body, user) => {
  const connection = await db.getConnection();

  try {
    const tenant_id = user.tenant_id;
    const { trangThai } = body;

    if (!["active", "inactive"].includes(trangThai)) {
      const err = new Error("Trạng thái không hợp lệ");
      err.statusCode = 400;
      throw err;
    }

    await connection.beginTransaction();

    const [merchantRows] = await connection.execute(
      `
      SELECT merchant_id, tenant_id, hoTen, trangThai
      FROM merchant
      WHERE merchant_id = ? AND tenant_id = ?
      LIMIT 1
      `,
      [merchant_id, tenant_id],
    );

    if (merchantRows.length === 0) {
      const err = new Error("Không tìm thấy tiểu thương");
      err.statusCode = 404;
      throw err;
    }

    const current = merchantRows[0];
    const goingInactive =
      current.trangThai !== "inactive" && trangThai === "inactive";

    if (goingInactive) {
      const activeAssignment = await hasActiveAssignment(
        connection,
        tenant_id,
        merchant_id,
      );

      if (activeAssignment) {
        const err = new Error(
          "Không thể khóa tiểu thương vì còn kiosk đang được gán",
        );
        err.statusCode = 409;
        throw err;
      }

      const outstanding = await hasOutstandingDebt(
        connection,
        tenant_id,
        merchant_id,
      );

      if (outstanding) {
        const err = new Error("Không thể khóa tiểu thương vì vẫn còn công nợ");
        err.statusCode = 409;
        throw err;
      }
    }

    await connection.execute(
      `
      UPDATE merchant
      SET trangThai = ?,
          inactive_at = CASE WHEN ? = 'inactive' THEN NOW() ELSE NULL END,
          updated_at = NOW()
      WHERE merchant_id = ? AND tenant_id = ?
      `,
      [trangThai, trangThai, merchant_id, tenant_id],
    );

    const [updatedRows] = await connection.execute(
      `
      SELECT merchant_id, tenant_id, hoTen, soDienThoai, CCCD, maSoThue,
             diaChiThuongTru, ngayThamGiaKinhDoanh, trangThai, inactive_at,
             created_at, updated_at
      FROM merchant
      WHERE merchant_id = ? AND tenant_id = ?
      LIMIT 1
      `,
      [merchant_id, tenant_id],
    );

    await connection.commit();
    return updatedRows[0];
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};
