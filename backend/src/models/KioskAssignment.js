const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const KioskAssignment = sequelize.define('KioskAssignment', {
  assignment_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  kiosk_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  merchant_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  ngayBatDau: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  ngayKetThuc: {
    type: DataTypes.DATE
  },
  trangThai: {
    type: DataTypes.ENUM('dang_thue', 'da_ket_thuc'),
    defaultValue: 'dang_thue'
  },
  tenant_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  }
}, {
  tableName: 'kiosk_assignments',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = KioskAssignment;