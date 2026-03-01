const { DataTypes } = require('sequelize');
const sequelize= require('../config/database');

const FeeAssignment = sequelize.define('FeeAssignment', {
  assignment_id: {
    type: DataTypes.INTEGER.UNSIGNED,
    primaryKey: true,
    autoIncrement: true
  },
  tenant_id: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false
  },
  fee_id: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false
  },
  target_type: {
    type: DataTypes.ENUM('kiosk', 'zone', 'kiosk_type'),
    allowNull: false
  },
  target_id: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false
  },
  ngayApDung: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  trangThai: {
    type: DataTypes.ENUM('active', 'inactive'),
    defaultValue: 'active'
  },
  mucMienGiam: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 0,
    validate: {
      min: 0,
      max: 100
    }
  }
}, {
  tableName: 'fee_assignment',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      unique: true,
      fields: ['tenant_id', 'fee_id', 'target_type', 'target_id', 'ngayApDung']
    }
  ]
});

module.exports = FeeAssignment;