const { DataTypes } = require('sequelize');
const sequelize= require('../config/database');

const ReceiptCharge = sequelize.define('ReceiptCharge', {
  receipt_id: {
    type: DataTypes.INTEGER.UNSIGNED,
    primaryKey: true
  },
  charge_id: {
    type: DataTypes.INTEGER.UNSIGNED,
    primaryKey: true
  },
  tenant_id: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false
  },
  soTienDaTra: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false
  }
}, {
  tableName: 'receipt_charge',
  timestamps: false
});

module.exports = ReceiptCharge;