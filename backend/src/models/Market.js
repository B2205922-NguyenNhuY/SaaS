const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Market = sequelize.define('Market', {
  market_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  tenCho: {
    type: DataTypes.STRING(200),
    allowNull: false
  },
  diaChi: {
    type: DataTypes.TEXT
  },
  dienTich: {
    type: DataTypes.DECIMAL(10, 2)
  },
  tenant_id: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false
  },
  trangThai: {
    type: DataTypes.ENUM('hoat_dong', 'tam_dung'),
    defaultValue: 'hoat_dong'
  }
}, {
  tableName: 'markets',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = Market;