const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const PaymentTransaction = sequelize.define('PaymentTransaction', {
  transaction_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  charge_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  soTien: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false
  },
  hinhThucThu: {
    type: DataTypes.ENUM('tien_mat', 'chuyen_khoan'),
    allowNull: false
  },
  thoiGianThu: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  ghiChu: {
    type: DataTypes.TEXT
  },
  anhChupChungTu: {
    type: DataTypes.JSON 
  },
  shift_id: {
    type: DataTypes.INTEGER
  },
  tenant_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  trangThai: {
    type: DataTypes.ENUM('thanh_cong', 'that_bai', 'dang_xu_ly'),
    defaultValue: 'thanh_cong'
  },
  gateway_transaction_id: {
    type: DataTypes.STRING(100)
  },
  payment_account: {
    type: DataTypes.STRING(50)
  }
}, {
  tableName: 'payment_transactions',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = PaymentTransaction;