const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const bcrypt = require('bcryptjs');

const Tenant = sequelize.define('Tenant', {
  tenant_id: {
    type: DataTypes.INTEGER.UNSIGNED,
    primaryKey: true,
    autoIncrement: true
  },
  tenBanQuanLy: {
    type: DataTypes.STRING(150),
    allowNull: false
  },
  diaChi: {
    type: DataTypes.STRING(255)
  },
  soDienThoai: {
    type: DataTypes.STRING(15),
    allowNull: false,
    unique: true
  },
  email: {
    type: DataTypes.STRING(150),
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  matkhau: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  trangThai: {
    type: DataTypes.ENUM('active', 'suspended'),
    defaultValue: 'active'
  }
}, {
  tableName: 'tenant',
  timestamps: true,
  underscored: true,
  hooks: {
    beforeCreate: async (tenant) => {
      if (tenant.matkhau) {
        tenant.matkhau = await bcrypt.hash(tenant.matkhau, 10);
      }
    },
    beforeUpdate: async (tenant) => {
      if (tenant.changed('matkhau')) {
        tenant.matkhau = await bcrypt.hash(tenant.matkhau, 10);
      }
    }
  }
});

Tenant.prototype.comparePassword = async function(password) {
  return bcrypt.compare(password, this.matkhau);
};

Tenant.prototype.getActiveSubscription = async function() {
  const { PlanSubscription } = require('./index');
  return PlanSubscription.findOne({
    where: {
      tenant_id: this.tenant_id,
      trangThai: 'active',
      ngayBatDau: { [Op.lte]: new Date() },
      ngayKetThuc: { [Op.gte]: new Date() }
    }
  });
};

module.exports = Tenant;