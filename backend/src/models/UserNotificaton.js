const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const UserNotification = sequelize.define('UserNotification', {
  user_notification_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  notification_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  da_doc: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  ngayDoc: {
    type: DataTypes.DATE
  },
  tenant_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  }
}, {
  tableName: 'user_notifications',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false
});

module.exports = UserNotification;