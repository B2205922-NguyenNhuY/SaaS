const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Kiosk = sequelize.define('Kiosk', {
  kiosk_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  maKiosk: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  viTriChiTiet: {
    type: DataTypes.STRING(200)
  },
  dienTich: {
    type: DataTypes.DECIMAL(10, 2)
  },
  moTa: {
    type: DataTypes.TEXT
  },
  type_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  zone_id: {
    type: DataTypes.INTEGER
  },
  market_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  tenant_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  trangThai: {
    type: DataTypes.ENUM('trong', 'dang_thue', 'bao_tri', 'da_khoa'),
    defaultValue: 'trong'
  },
  hinhAnh: {
    type: DataTypes.JSON
  }
}, {
  tableName: 'kiosks',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = Kiosk;