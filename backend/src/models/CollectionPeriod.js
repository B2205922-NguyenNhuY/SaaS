const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const CollectionPeriod = sequelize.define('CollectionPeriod', {
  period_id: {
    type: DataTypes.INTEGER.UNSIGNED,
    primaryKey: true,
    autoIncrement: true
  },
  tenant_id: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false
  },
  tenKyThu: {
    type: DataTypes.STRING(150)
  },
  ngayBatDau: {
    type: DataTypes.DATE,
    allowNull: false
  },
  ngayKetThuc: {
    type: DataTypes.DATE,
    allowNull: false
  },
  loaiKy: {
    type: DataTypes.ENUM('ngay', 'thang'),
    allowNull: false
  }
}, {
  tableName: 'collection_period',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      unique: true,
      fields: ['tenant_id', 'ngayBatDau', 'ngayKetThuc']
    }
  ]
});

module.exports = CollectionPeriod;