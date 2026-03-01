const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const WalletTransaction = sequelize.define('WalletTransaction', {
  wallet_transaction_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  wallet_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  loai: {
    type: DataTypes.ENUM('nap', 'thanh_toan', 'hoan_tien'),
    allowNull: false
  },
  soTien: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false
  },
  soDuSauGiaoDich: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false
  },
  charge_id: {
    type: DataTypes.INTEGER
  },
  transaction_id: {
    type: DataTypes.STRING(100)
  },
  moTa: {
    type: DataTypes.TEXT
  },
  tenant_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  }
}, {
  tableName: 'wallet_transactions',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = WalletTransaction;