const { DataTypes } = require('sequelize');
const  sequelize = require('../config/database');

const Notification = sequelize.define('Notification', {
  notification_id: {
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
    allowNull: false // Người nhận
  },
  sender_id: {
    type: DataTypes.INTEGER.UNSIGNED, // Người gửi (tenant admin hoặc super admin)
    allowNull: true
  },
  tieuDe: {
    type: DataTypes.STRING(200),
    allowNull: false
  },
  noiDung: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  loai: {
    type: DataTypes.ENUM('he_thong', 'canh_bao', 'thong_bao', 'nhac_nho'),
    defaultValue: 'thong_bao'
  },
  daDoc: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  ngayDoc: {
    type: DataTypes.DATE
  },
  link: {
    type: DataTypes.STRING(500) 
  }
}, {
  tableName: 'notifications',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false
});

module.exports = Notification;