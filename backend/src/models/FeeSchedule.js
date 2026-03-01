const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const FeeSchedule = sequelize.define('FeeSchedule', {
  fee_id: {
    type: DataTypes.INTEGER.UNSIGNED,
    primaryKey: true,
    autoIncrement: true
  },
  tenant_id: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false
  },
  tenBieuPhi: {
    type: DataTypes.STRING(150),
    allowNull: false
  },
  hinhThuc: {
    type: DataTypes.ENUM('ngay', 'thang'),
    allowNull: false
  },
  donGia: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false
  },
  moTa: {
    type: DataTypes.TEXT
  }
}, {
  tableName: 'fee_schedule',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      unique: true,
      fields: ['tenant_id', 'tenBieuPhi']
    }
  ]
});

module.exports = FeeSchedule;