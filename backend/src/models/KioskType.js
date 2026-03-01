const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const KioskType = sequelize.define('KioskType', {
  type_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  tenLoai: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  moTa: {
    type: DataTypes.TEXT
  }
}, {
  tableName: 'kiosk_types',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = KioskType;