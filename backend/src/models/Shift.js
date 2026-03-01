const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Shift = sequelize.define('Shift', {
  shift_id: {
    type: DataTypes.INTEGER.UNSIGNED,
    primaryKey: true,
    autoIncrement: true
  },
  tenant_id: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false
  },
  user_id: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false
  },
  thoiGianBatDauCa: {
    type: DataTypes.DATE,
    allowNull: false
  },
  thoiGianKetThucCa: {
    type: DataTypes.DATE
  },
  tongTienMatThuDuoc: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0
  },
  tongChuyenKhoanThuDuoc: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0
  },
  trangThaiDoiSoat: {
    type: DataTypes.ENUM('pending', 'completed', 'discrepancy'),
    defaultValue: 'pending'
  }
}, {
  tableName: 'shift',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = Shift;