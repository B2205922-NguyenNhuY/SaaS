const { DataTypes } = require('sequelize');
const sequelize  = require('../config/database');

const AuditLog = sequelize.define('AuditLog', {
  log_id: {
    type: DataTypes.BIGINT.UNSIGNED,
    primaryKey: true,
    autoIncrement: true
  },
  tenant_id: {
    type: DataTypes.INTEGER.UNSIGNED
  },
  user_id: {
    type: DataTypes.INTEGER.UNSIGNED
  },
  super_admin_id: {
    type: DataTypes.INTEGER.UNSIGNED
  },
  hanhDong: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  thoiGianThucHien: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  entity_type: {
    type: DataTypes.STRING(50)
  },
  entity_id: {
    type: DataTypes.BIGINT.UNSIGNED
  },
  giaTriCu: {
    type: DataTypes.JSON
  },
  giaTriMoi: {
    type: DataTypes.JSON
  }
}, {
  tableName: 'audit_log',
  timestamps: false
});

module.exports = AuditLog;