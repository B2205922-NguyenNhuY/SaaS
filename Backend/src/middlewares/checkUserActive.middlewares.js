const db = require("../config/db");

exports.checkUserActive = async (req, res, next) => {
  try {
    const role = req.user?.role;

    if (role === "super_admin") {
      const adminId = req.user?.id || req.user?.admin_id;

      if (!adminId) {
        return res.status(401).json({ message: "Không xác định được tài khoản" });
      }

      const [[admin]] = await db.execute(
        "SELECT admin_id, trangThai FROM super_admin WHERE admin_id = ?",
        [adminId]
      );

      if (!admin) {
        return res.status(404).json({ message: "Tài khoản không tồn tại" });
      }

      if (admin.trangThai !== "active") {
        return res.status(403).json({ message: "Tài khoản đã bị khóa" });
      }

      return next();
    }

    if (role === "merchant") {
      const merchantId = req.user?.id;

      if (!merchantId) {
        return res.status(401).json({ message: "Không xác định được tài khoản" });
      }

      const [[merchant]] = await db.execute(
        "SELECT merchant_id, trangThai FROM merchant WHERE merchant_id = ?",
        [merchantId]
      );
      
      if (!merchant) {
        return res.status(404).json({ message: "Tài khoản không tồn tại" });
      }

      if (merchant.trangThai !== "active") {
        return res.status(403).json({ message: "Tài khoản đã bị khóa" });
      }

      return next();
    }

    const userId = req.user?.id || req.user?.user_id;
    console.log("userid:", userId);

    if (!userId) {
      return res.status(401).json({ message: "Không xác định được tài khoản" });
    }

    const [[user]] = await db.execute(
      "SELECT user_id, trangThai FROM users WHERE user_id = ?",
      [userId]
    );
    console.log("user:", user);

    if (!user) {
      return res.status(404).json({ message: "Tài khoản không tồn tại" });
    }

    if (user.trangThai !== "active") {
      return res.status(403).json({ message: "Tài khoản đã bị tạm khóa hoặc xóa" });
    }

    next();
  } catch (error) {
    next(error);
  }
};