const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Charge = sequelize.define('Charge', {
  charge_id: {
    type: DataTypes.INTEGER.UNSIGNED,
    primaryKey: true,
    autoIncrement: true
  },
  tenant_id: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false
  },
  period_id: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false
  },
  kiosk_id: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false
  },
  merchant_id: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false
  },
  fee_id: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false
  },
  donGiaApDung: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false
  },
  hinhThucApDung: {
    type: DataTypes.ENUM('ngay', 'thang'),
    allowNull: false
  },
  soTienPhaiThu: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false
  },
  soTienDaThu: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0
  },
  trangThai: {
    type: DataTypes.ENUM('chua_thu', 'da_thu', 'no', 'mien'),
    defaultValue: 'chua_thu'
  },
  version: {
    type: DataTypes.INTEGER,
    defaultValue: 1
  }
}, {
  tableName: 'charge',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      unique: true,
      fields: ['tenant_id', 'period_id', 'kiosk_id']
    }
  ]
});

module.exports = Charge;