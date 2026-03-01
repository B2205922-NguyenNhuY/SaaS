const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Report = sequelize.define('Report', {
  report_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  tenBaoCao: {
    type: DataTypes.STRING(200),
    allowNull: false
  },
  loaiBaoCao: {
    type: DataTypes.ENUM('thu', 'cong_no', 'hieu_suat', 'doanh_thu', 'tong_hop'),
    allowNull: false
  },
  dinhDang: {
    type: DataTypes.ENUM('excel', 'pdf', 'csv'),
    defaultValue: 'excel'
  },
  duongDanFile: {
    type: DataTypes.STRING(500)
  },
  thamSo: {
    type: DataTypes.JSON // Store report parameters
  },
  created_by: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  tenant_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  trangThai: {
    type: DataTypes.ENUM('dang_xu_ly', 'hoan_thanh', 'that_bai'),
    defaultValue: 'dang_xu_ly'
  }
}, {
  tableName: 'reports',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = Report;