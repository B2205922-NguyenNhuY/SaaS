const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const PlanSubscription = sequelize.define('PlanSubscription', {
  subscription_id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true
  },
  tenant_id: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    primaryKey: true
  },
  plan_id: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false
  },
  trangThai: {
    type: DataTypes.ENUM('active','expired','trial','cancelled'),
    defaultValue: 'active'
  },
  ngayBatDau: {
    type: DataTypes.DATE,
    allowNull: false
  },
  ngayKetThuc: {
    type: DataTypes.DATE,
    allowNull: false
  },
  auto_renew: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'plan_subscription',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = PlanSubscription;