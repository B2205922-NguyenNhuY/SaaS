const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Plan = sequelize.define('Plan', {
  plan_id: {
    type: DataTypes.INTEGER.UNSIGNED,
    primaryKey: true,
    autoIncrement: true
  },
  tenGoi: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  giaTien: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    defaultValue: 0
  },
  gioiHanSoKiosk: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false
  },
  gioiHanUser: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false
  },
  gioiHanSoCho: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false
  },
  moTa: {
    type: DataTypes.TEXT
  }
}, {
  tableName: 'plan',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = Plan;