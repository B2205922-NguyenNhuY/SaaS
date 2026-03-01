const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Zone = sequelize.define('Zone', {
  zone_id: {
    type: DataTypes.INTEGER.UNSIGNED,
    primaryKey: true,
    autoIncrement: true
  },
  tenant_id: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false
  },
  market_id: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false
  },
  tenKhu: {
    type: DataTypes.STRING(150),
    allowNull: false
  },
  trangThai: {
    type: DataTypes.ENUM('active', 'locked'),
    defaultValue: 'active'
  }
}, {
  tableName: 'zone',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = Zone;