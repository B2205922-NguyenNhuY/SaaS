const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Merchant = sequelize.define('Merchant', {
  merchant_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  hoTen: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  soDienThoai: {
    type: DataTypes.STRING(20)
  },
  email: {
    type: DataTypes.STRING(100),
    validate: {
      isEmail: true
    }
  },
  diaChiThuongTru: {
    type: DataTypes.TEXT
  },
  soCMND_CCCD: {
    type: DataTypes.STRING(20)
  },
  ngaySinh: {
    type: DataTypes.DATE
  },
  tenant_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  trangThai: {
    type: DataTypes.ENUM('hoat_dong', 'tam_ngung', 'khoa'),
    defaultValue: 'hoat_dong'
  },
  giayToTuyThan: {
    type: DataTypes.JSON 
  }
}, {
  tableName: 'merchants',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = Merchant;