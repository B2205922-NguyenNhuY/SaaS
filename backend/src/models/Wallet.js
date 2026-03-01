const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Wallet = sequelize.define('Wallet', {
  wallet_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  merchant_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: true
  },
  soDu: {
    type: DataTypes.DECIMAL(15, 2),
    defaultValue: 0
  },
  tenant_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  trangThai: {
    type: DataTypes.ENUM('hoat_dong', 'khoa'),
    defaultValue: 'hoat_dong'
  }
}, {
  tableName: 'wallets',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = Wallet;