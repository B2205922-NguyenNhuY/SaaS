const express = require("express");
const cors = require("cors");
const { pool } = require("./config/db"); // Import pool từ config
require("dotenv").config();

const apiRoutes = require("./routes");

const app = express();
app.use(cors());
app.use(express.json());

// 1. Các Route chính
app.use("/api", apiRoutes);
app.get("/health", (req, res) => res.json({ ok: true }));

// 2. 404 Handler (Phải đặt SAU các route chính)
app.use((req, res) => {
  res.status(404).json({ message: "Đường dẫn API không tồn tại" });
});

// 3. Middleware xử lý lỗi tập trung
app.use((err, req, res, next) => {
  console.error("Error Log:", err.stack);

  if (err.name === "ZodError") {
    return res.status(400).json({
      message: "Dữ liệu không hợp lệ",
      errors: err.errors,
    });
  }

  res.status(500).json({ message: "Đã có lỗi xảy ra từ phía server" });
});

// 4. Kiểm tra DB và khởi động Server
async function startServer() {
  try {
    // Thử kết nối DB trước khi listen
    await pool.query("SELECT 1");
    console.log("Database connected successfully.");

    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to connect to Database:", error.message);
    process.exit(1); // Dừng ứng dụng nếu không có DB
  }
}

startServer();
