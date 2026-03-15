const db = require("../config/db");
const model = require("../models/kioskAssignment.model");

function todayYMD() {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}

// assign kiosk
exports.assign = async (tenant_id, body) => {
  const kiosk_id = Number(body.kiosk_id);
  const merchant_id = Number(body.merchant_id);
  const ngayBatDau = body.ngayBatDau;

  if (!kiosk_id || !merchant_id || !ngayBatDau) {
    throw Object.assign(
      new Error("kiosk_id, merchant_id, ngayBatDau are required"),
      { statusCode: 400 }
    );
  }

  const conn = await db.getConnection();

  try {
    await conn.beginTransaction();

    const active = await model.getActiveByKiosk(conn, tenant_id, kiosk_id);

    if (active) {
      throw Object.assign(
        new Error("Kiosk already assigned. End current assignment first."),
        { statusCode: 409 }
      );
    }

    const assignment_id = await model.create(conn, {
      tenant_id,
      kiosk_id,
      merchant_id,
      ngayBatDau,
    });

    await model.updateKioskStatus(conn, tenant_id, kiosk_id, "occupied");

    await conn.commit();

    return {
      assignment_id,
      kiosk_id,
      merchant_id,
      ngayBatDau,
      trangThai: "active",
    };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};


// end assignment
exports.end = async (tenant_id, assignment_id) => {
  const conn = await db.getConnection();
  const ngayKetThuc = todayYMD();

  try {
    await conn.beginTransaction();

    const ka = await model.getById(conn, tenant_id, assignment_id);

    if (!ka) {
      throw Object.assign(new Error("Assignment not found"), {
        statusCode: 404,
      });
    }

    if (ka.trangThai !== "active") {
      throw Object.assign(new Error("Assignment already ended"), {
        statusCode: 409,
      });
    }

    await model.endAssignment(conn, tenant_id, assignment_id, ngayKetThuc);

    await model.updateKioskStatus(conn, tenant_id, ka.kiosk_id, "available");

    await conn.commit();

    return {
      ok: true,
      assignment_id,
      ngayKetThuc,
      trangThai: "ended",
    };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};


// list assignment
exports.list = async (tenant_id, filters, pg) => {
  const where = ["ka.tenant_id = ?"];
  const params = [tenant_id];

  if (filters.kiosk_id) {
    const kiosk_id = Number(filters.kiosk_id);

    if (!Number.isInteger(kiosk_id)) {
      throw Object.assign(new Error("Invalid kiosk_id"), { statusCode: 400 });
    }

    where.push("ka.kiosk_id = ?");
    params.push(kiosk_id);
  }

  if (filters.merchant_id) {
    const merchant_id = Number(filters.merchant_id);

    if (!Number.isInteger(merchant_id)) {
      throw Object.assign(new Error("Invalid merchant_id"), { statusCode: 400 });
    }

    where.push("ka.merchant_id = ?");
    params.push(merchant_id);
  }

  if (filters.trangThai) {
    where.push("ka.trangThai = ?");
    params.push(filters.trangThai);
  }

  // whitelist sort
  const allowedSort = ["created_at", "ngayBatDau", "ngayKetThuc"];
  const sort = allowedSort.includes(pg.sort) ? pg.sort : "created_at";

  // chỉ cho ASC hoặc DESC
  const order = pg.order === "ASC" ? "ASC" : "DESC";

  // ép kiểu limit offset
  const limit = Number(pg.limit);
    const offset = Number(pg.offset);

    if (!Number.isInteger(limit) || limit <= 0) {
    limit = 10;
    }

    if (!Number.isInteger(offset) || offset < 0) {
    offset = 0;
    }

  const total = await model.count(where.join(" AND "), params);

  console.log("limit:", limit);
console.log("offset:", offset);
console.log("sort:", sort);
console.log("order:", order);

  const rows = await model.list(
    where.join(" AND "),
    params,
    sort,
    order,
    limit,
    offset
  );

  return {
    data: rows,
    meta: {
      page: pg.page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};


// get detail
exports.getById = async (tenant_id, assignment_id) => {
  const row = await model.getById(null, tenant_id, assignment_id);

  if (!row) {
    throw Object.assign(new Error("Assignment not found"), {
      statusCode: 404,
    });
  }

  return row;
};