const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Receipt = sequelize.define('Receipt', {
  receipt_id: {
    type: DataTypes.INTEGER.UNSIGNED,
    primaryKey: true,
    autoIncrement: true
  },
  tenant_id: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false
  },
  soTienThu: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false
  },
  hinhThucThanhToan: {
    type: DataTypes.ENUM('tien_mat', 'chuyen_khoan'),
    allowNull: false
  },
  ghiChu: {
    type: DataTypes.STRING(255)
  },
  anhChupThanhToan: {
    type: DataTypes.STRING(255)
  },
  thoiGianThu: {
    type: DataTypes.DATE,
    allowNull: false
  },
  user_id: {
    type: DataTypes.INTEGER.UNSIGNED
  },
  shift_id: {
    type: DataTypes.INTEGER.UNSIGNED
  }
}, {
  tableName: 'receipt',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = Receipt;