const db = require("../config/db");

//Tạo Subscription
exports.createSubscription = async (connection,data) => {
    const {plan_id, tenant_id, stripe_subscription_id, trangThai, ngayBatDau, ngayKetThuc} = data;

    const [result] = await connection.execute(
        "INSERT INTO plan_subscription (plan_id, tenant_id, stripe_subscription_id, trangThai, ngayBatDau, ngayKetThuc) VALUES (?, ?, ?, ?, ?, ?)",
        [plan_id, tenant_id, stripe_subscription_id, trangThai, ngayBatDau, ngayKetThuc]
    );

    return result.insertId;
};

//Tạo Pending
exports.createPending = async ({tenant_id, plan_id, ngayBatDau, ngayKetThuc}) => {

    const [result] = await connection.execute(
        "INSERT INTO plan_subscription (plan_id, tenant_id, trangThai, ngayBatDau, ngayKetThuc) VALUES (?, ?, 'pending', ?, ?)",
        [plan_id, tenant_id, ngayBatDau, ngayKetThuc]
    );

    return result.insertId;
};

//Lấy tất cả Subscription
exports.getAllSubscriptions = async () => {
    const [rows] = await db.execute(
        "SELECT * FROM plan_subscription"
    );

    return rows;
};

//Lấy subscription theo id
exports.getSubscriptiontById = async (id) => {
    const [rows] = await db.execute(
        "SELECT * FROM plan_subscription WHERE subscription_id = ?",
        [id]
    );

    return rows[0];
};

exports.getSubscriptionsByTenantId = async (tenant_id) => {
  const [rows] = await db.execute(
    `SELECT ps.*, p.tenGoi, p.giaTien, p.gioiHanSoCho, p.gioiHanSoKiosk, p.gioiHanUser
     FROM plan_subscription ps
     JOIN plan p ON ps.plan_id = p.plan_id
     WHERE ps.tenant_id = ?
     ORDER BY ps.created_at DESC`,
    [tenant_id]
  );
  return rows;
};

//Lấy subscription theo stripe_subscription_id
exports.getSubscriptionByStripeId = async (connection, stripe_subscription_id) => {
    const [rows] = await connection.execute(
        "SELECT * FROM plan_subscription WHERE stripe_subscription_id = ?",
        [stripe_subscription_id]
    );

    return rows[0];
};

//Lấy subscription theo id
exports.getSubscriptiontByStatus = async (status) => {
    const [rows] = await db.execute(
        "SELECT * FROM plan_subscription WHERE status = ?",
        [status]
    );

    return rows;
};

exports.listSubscriptions = async (filters, offset, limit) => {
    let sql = `
        SELECT 
            ps.subscription_id,
            ps.tenant_id,
            ps.plan_id,
            ps.trangThai,
            ps.payment_status,
            ps.ngayBatDau,
            ps.ngayKetThuc,
            ps.trial_end_date,
            ps.grace_period_end,
            ps.created_at,
            p.tenGoi,
            p.giaTien,
            t.tenBanQuanLy,
            t.email,
            t.trangThai as tenant_status,
            t.created_at as tenantCreatedAt
        FROM plan_subscription ps
        JOIN plan p ON ps.plan_id = p.plan_id
        JOIN tenant t ON ps.tenant_id = t.tenant_id
        WHERE 1=1
    `;
    
    const params = [];
    
    if (filters.tenant_id) {
        sql += ` AND ps.tenant_id = ?`;
        params.push(filters.tenant_id);
    }
    
    if (filters.plan_id) {
        sql += ` AND ps.plan_id = ?`;
        params.push(filters.plan_id);
    }
    
    if (filters.trangThai) {
        sql += ` AND ps.trangThai = ?`;
        params.push(filters.trangThai);
    }
    
    if (filters.keyword) {
        sql += ` AND (t.tenBanQuanLy LIKE ? OR t.email LIKE ?)`;
        params.push(`%${filters.keyword}%`, `%${filters.keyword}%`);
    }
    
    const allowedSort = ["created_at", "ngayBatDau", "ngayKetThuc"];
    const sortBy = allowedSort.includes(filters.sortBy) ? filters.sortBy : "created_at";
    const sortOrder = filters.sortOrder === "ASC" ? "ASC" : "DESC";
    
    sql += ` ORDER BY ps.${sortBy} ${sortOrder}`;
    sql += ` LIMIT ${Number(limit)} OFFSET ${Number(offset)}`;
    
    const [rows] = await db.execute(sql, params);
    return rows;
};

exports.countSubscriptions = async (filters) => {

  let sql = `
    SELECT COUNT(*) as total
    FROM plan_subscription ps
    JOIN tenant t ON ps.tenant_id = t.tenant_id
    WHERE 1=1
  `;

  const params = [];

  if (filters.tenant_id) {
    sql += ` AND ps.tenant_id = ?`;
    params.push(filters.tenant_id);
  }

  if (filters.plan_id) {
    sql += ` AND ps.plan_id = ?`;
    params.push(filters.plan_id);
  }

  if (filters.trangThai) {
    sql += ` AND ps.trangThai = ?`;
    params.push(filters.trangThai);
  }

  if (filters.keyword) {
    sql += ` AND (t.tenBanQuanLy LIKE ? OR t.email LIKE ?)`;
    params.push(`%${filters.keyword}%`, `%${filters.keyword}%`);
  }

  if (filters.ngayBatDau) {
    sql += ` AND ps.ngayBatDau >= ?`;
    params.push(filters.ngayBatDau);
  }

  if (filters.ngayKetThuc) {
    sql += ` AND ps.ngayKetThuc <= ?`;
    params.push(filters.ngayKetThuc);
  }

  const [rows] = await db.execute(sql, params);

  return rows[0].total;
};

exports.updateEndDate = async (connection,subscription_id,endDate) => {
    await connection.execute(
    "UPDATE plan_subscription SET ngayKetThuc = ?, trangThai = 'active' WHERE subscription_id = ?",
    [endDate, subscription_id]
  );
};


//Cập nhật stripe_subscription
exports.updateStripeSubscriptionId = async (connection,subscription_id,stripe_subscription_id) => {
    await connection.execute(
    "UPDATE plan_subscription SET stripe_subscription_id = ?, trangThai = 'active' WHERE subscription_id = ?",
    [stripe_subscription_id, subscription_id]
  );
};

//Cập nhật trạng thái Subscription
exports.updateSubscriptionStatus = async (id) => {
    
    const [result] = await db.execute(
        "UPDATE plan_subscription SET trangThai = 'expired' WHERE subscription_id=?",
        [id]
    );

    return result;
};


//Kiểm tra trùng
exports.checkDuplicate = async (tenant_id) => {
    const [rows] = await db.execute(
        "SELECT subscription_id FROM plan_subscription WHERE tenant_id=? AND trangThai='active'",
        [tenant_id]
    );

    return rows;
}

//Kiểm tra Gói còn hiệu lực
exports.checkSubscription = async (tenant_id) => {
    const [rows] = await db.execute(
        "SELECT * FROM plan_subscription WHERE tenant_id=? AND trangThai='active' AND ngayKetThuc>NOW()",
        [tenant_id]
    );

    return rows;
}

//Kiểm tra đăng ký gói
exports.checkSubscribed = async (tenant_id) => {
    const [rows] = await db.execute(
        "SELECT * FROM plan_subscription WHERE tenant_id=? ORDER BY subscription_id DESC LIMIT 1",
        [tenant_id]
    );

    return rows;
}
//Tìm Subscription active

exports.getActiveByTenantForUpdate = async (tenant_id) => {
    const [rows] = await db.execute(
        `SELECT subscription_id, trangThai, ngayKetThuc, grace_period_end 
        FROM plan_subscription 
        WHERE tenant_id = ? AND trangThai IN ('active', 'trial', 'expired')
        ORDER BY created_at DESC LIMIT 1
        FOR UPDATE`,
        [tenant_id]
    );
    return rows;
};

//Tìm gói tenant đang đăng ký
exports.getPlanByTenantSubscribed = async (tenant_id) => {
    const [rows] = await db.execute(
        "SELECT p.* FROM plan_subscription ps JOIN plan p ON ps.plan_id = p.plan_id WHERE ps.tenant_id=? AND ps.trangThai='active'",
        [tenant_id]
    );

    return rows
};

//Update Subscription active thành hết hạn
exports.expireActiveByTenant = async (connection, tenant_id) => {
    await connection.execute(
        "UPDATE plan_subscription SET trangThai='expired' WHERE tenant_id=? AND trangThai = 'active'",
        [tenant_id]
    );
};

//Update Subscription hết hạn
exports.expire = async (subscription_id) => {
    await connection.execute(
        "UPDATE plan_subscription SET trangThai='expired' WHERE subscription_id=?",
        [subscription_id]
    );
};

//Kích hoạt subscription sau thanh toán
exports.activateSubscription = async (connection,subscription_id) => {
  await connection.execute(
    "UPDATE plan_subscription SET trangThai = 'active' WHERE subscription_id = ?",
    [subscription_id]
  );
};

//Kích hoạt subscription sau thanh toán
exports.activate = async (subscription_id, stripe_subscription_id) => {
  await connection.execute(
    "UPDATE plan_subscription SET trangThai = 'active', stripe_subsciption_id=? WHERE subscription_id = ?",
    [stripe_subscription_id, subscription_id]
  );
};

//Gia hạn gói
exports.extendSubscription = async (connection, subscription_id) => {
  await connection.execute(
    "UPDATE plan_subscription SET trangThai = 'active', ngayKetThuc = DATE_ADD(ngayKetThuc, INTERVAL 1 MONTH) WHERE subscription_id = ?",
    [subscription_id]
  );
};

//Gia hạn gói
exports.extendEndDate = async (subscription_id) => {
  await connection.execute(
    "UPDATE plan_subscription SET trangThai = 'active', ngayKetThuc = DATE_ADD(ngayKetThuc, INTERVAL 1 MONTH) WHERE subscription_id = ?",
    [subscription_id]
  );
};

// Tạo subscription trial cho tenant mới
exports.createTrialSubscription = async (connection, tenant_id, plan_id, trialDays = 7) => {
    const ngayBatDau = new Date();
    const ngayKetThuc = new Date(ngayBatDau);
    ngayKetThuc.setDate(ngayKetThuc.getDate() + trialDays);
    
    const trial_end_date = new Date(ngayBatDau);
    trial_end_date.setDate(trial_end_date.getDate() + trialDays);
    
    const [result] = await connection.execute(
        `INSERT INTO plan_subscription 
        (plan_id, tenant_id, trangThai, payment_status, ngayBatDau, ngayKetThuc, trial_end_date) 
        VALUES (?, ?, 'trial', 'unpaid', ?, ?, ?)`,
        [plan_id, tenant_id, ngayBatDau, ngayKetThuc, trial_end_date]
    );
    
    return result.insertId;
};

// Tạo subscription active (sau khi thanh toán lần đầu)
exports.createActiveSubscription = async (connection, tenant_id, plan_id, months = 1) => {
    await exports.expireActiveByTenant(connection, tenant_id);
    
    const ngayBatDau = new Date();
    const ngayKetThuc = new Date(ngayBatDau);
    ngayKetThuc.setMonth(ngayKetThuc.getMonth() + months);
    
    const [result] = await connection.execute(
        `INSERT INTO plan_subscription 
        (plan_id, tenant_id, trangThai, payment_status, ngayBatDau, ngayKetThuc) 
        VALUES (?, ?, 'active', 'paid', ?, ?)`,
        [plan_id, tenant_id, ngayBatDau, ngayKetThuc]
    );
    
    return result.insertId;
};

// Gia hạn subscription (thanh toán thành công khi đang active hoặc trong grace period)
exports.renewSubscription = async (connection, subscription_id, months = 1) => {
    // Lấy subscription hiện tại
    const [rows] = await connection.execute(
        `SELECT * FROM plan_subscription WHERE subscription_id = ?`,
        [subscription_id]
    );
    
    if (rows.length === 0) return null;
    
    const current = rows[0];
    let newEndDate = new Date(current.ngayKetThuc);
    
    if (new Date() > newEndDate) {
        newEndDate = new Date();
    }
    newEndDate.setMonth(newEndDate.getMonth() + months);
    
    await connection.execute(
        `UPDATE plan_subscription 
        SET trangThai = 'active', 
            payment_status = 'paid',
            ngayKetThuc = ?,
            grace_period_end = NULL
        WHERE subscription_id = ?`,
        [newEndDate, subscription_id]
    );
    
    return subscription_id;
};

// Đánh dấu subscription đã hết hạn (expired)
exports.markAsExpired = async (connection, subscription_id) => {
    await connection.execute(
        `UPDATE plan_subscription 
        SET trangThai = 'expired', payment_status = 'overdue'
        WHERE subscription_id = ? AND trangThai = 'active'`,
        [subscription_id]
    );
};

// Thiết lập grace period (5 ngày ân hạn)
exports.setGracePeriod = async (connection, subscription_id, graceDays = 5) => {
    const grace_end = new Date();
    grace_end.setDate(grace_end.getDate() + graceDays);
    
    await connection.execute(
        `UPDATE plan_subscription 
        SET grace_period_end = ? 
        WHERE subscription_id = ?`,
        [grace_end, subscription_id]
    );
};

// Kiểm tra và xử lý hết hạn (có grace period)
exports.checkAndProcessExpired = async () => {
    const connection = await db.getConnection();
    
    try {
        await connection.beginTransaction();
        
        await connection.execute(`
            UPDATE plan_subscription 
            SET trangThai = 'expired', payment_status = 'overdue'
            WHERE trangThai = 'trial' 
            AND ngayKetThuc < NOW()
        `);
        
        await connection.execute(`
            UPDATE plan_subscription 
            SET trangThai = 'expired', 
                payment_status = 'overdue',
                grace_period_end = DATE_ADD(NOW(), INTERVAL 5 DAY)
            WHERE trangThai = 'active' 
            AND ngayKetThuc < NOW()
            AND grace_period_end IS NULL
        `);
        
        const [expiredSubs] = await connection.execute(`
            SELECT ps.subscription_id, ps.tenant_id 
            FROM plan_subscription ps
            WHERE ps.trangThai = 'expired' 
            AND ps.grace_period_end IS NOT NULL
            AND ps.grace_period_end < NOW()
        `);
        
        for (const sub of expiredSubs) {
            await connection.execute(
                `UPDATE tenant SET trangThai = 'suspended' WHERE tenant_id = ?`,
                [sub.tenant_id]
            );
        }
        
        await connection.commit();
        return expiredSubs;
        
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
};

// Khôi phục tenant khi thanh toán (mở khóa)
exports.restoreTenantSubscription = async (connection, tenant_id, plan_id, months = 1) => {
    await connection.execute(
        `UPDATE tenant SET trangThai = 'active' WHERE tenant_id = ? AND trangThai = 'suspended'`,
        [tenant_id]
    );
    
    const ngayBatDau = new Date();
    const ngayKetThuc = new Date(ngayBatDau);
    ngayKetThuc.setMonth(ngayKetThuc.getMonth() + months);
    
    const [result] = await connection.execute(
        `INSERT INTO plan_subscription 
        (plan_id, tenant_id, trangThai, payment_status, ngayBatDau, ngayKetThuc) 
        VALUES (?, ?, 'active', 'paid', ?, ?)`,
        [plan_id, tenant_id, ngayBatDau, ngayKetThuc]
    );
    
    return result.insertId;
};

// Kiểm tra tenant có bị khóa không
exports.isTenantSuspended = async (tenant_id) => {
    const [rows] = await db.execute(
        `SELECT trangThai FROM tenant WHERE tenant_id = ?`,
        [tenant_id]
    );
    return rows[0]?.trangThai === 'suspended';
};

// Lấy thông tin subscription kèm tenant
exports.getSubscriptionWithTenant = async (subscription_id) => {
    const [rows] = await db.execute(
        `SELECT ps.*, t.tenBanQuanLy, t.email, t.trangThai as tenant_status
        FROM plan_subscription ps
        JOIN tenant t ON ps.tenant_id = t.tenant_id
        WHERE ps.subscription_id = ?`,
        [subscription_id]
    );
    return rows[0];
};