const sequelize = require('../config/database');
const Tenant = require('./Tenant');
const Plan = require('./Plan');
const PlanSubscription = require('./PlanSubscription');
const Payment = require('./PaymentTransaction');
const Role = require('./Role');
const User = require('./User');
const Market = require('./Market');
const Zone = require('./Zone');
const KioskType = require('./KioskType');
const Kiosk = require('./Kiosk');
const Merchant = require('./Merchant');
const KioskAssignment = require('./KioskAssignment');
const FeeSchedule = require('./FeeSchedule');
const FeeAssignment = require('./FeeAssignment');
const CollectionPeriod = require('./CollectionPeriod');
const Shift = require('./Shift');
const Charge = require('./Charge');
const Receipt = require('./Receipt');
const ReceiptCharge = require('./ReceiptCharge');
const AuditLog = require('./AuditLog');


// Định nghĩa associations
const defineAssociations = () => {
  // Tenant - User
  Tenant.hasMany(User, { foreignKey: 'tenant_id' });
  User.belongsTo(Tenant, { foreignKey: 'tenant_id' });

  // Tenant - Role
  Tenant.hasMany(Role, { foreignKey: 'tenant_id' });
  Role.belongsTo(Tenant, { foreignKey: 'tenant_id' });

  // User - Role
  User.belongsTo(Role, { foreignKey: 'role_id', targetKey: 'role_id', constraints: false });
  Role.hasMany(User, { foreignKey: 'role_id' });

  // Tenant - PlanSubscription
  Tenant.hasMany(PlanSubscription, { foreignKey: 'tenant_id' });
  PlanSubscription.belongsTo(Tenant, { foreignKey: 'tenant_id' });

  // Plan - PlanSubscription
  Plan.hasMany(PlanSubscription, { foreignKey: 'plan_id' });
  PlanSubscription.belongsTo(Plan, { foreignKey: 'plan_id' });

  // Tenant - Market
  Tenant.hasMany(Market, { foreignKey: 'tenant_id' });
  Market.belongsTo(Tenant, { foreignKey: 'tenant_id' });

  // Market - Zone
  Market.hasMany(Zone, { foreignKey: 'market_id' });
  Zone.belongsTo(Market, { foreignKey: 'market_id' });

  // Zone - Kiosk
  Zone.hasMany(Kiosk, { foreignKey: 'zone_id' });
  Kiosk.belongsTo(Zone, { foreignKey: 'zone_id' });

  // KioskType - Kiosk
  KioskType.hasMany(Kiosk, { foreignKey: 'type_id' });
  Kiosk.belongsTo(KioskType, { foreignKey: 'type_id' });

  // Tenant - Merchant
  Tenant.hasMany(Merchant, { foreignKey: 'tenant_id' });
  Merchant.belongsTo(Tenant, { foreignKey: 'tenant_id' });

  // KioskAssignment relationships
  KioskAssignment.belongsTo(Kiosk, { foreignKey: 'kiosk_id' });
  KioskAssignment.belongsTo(Merchant, { foreignKey: 'merchant_id' });

  // FeeSchedule - Tenant
  FeeSchedule.belongsTo(Tenant, { foreignKey: 'tenant_id' });

  // FeeAssignment relationships
  FeeAssignment.belongsTo(FeeSchedule, { foreignKey: 'fee_id' });

  // CollectionPeriod - Tenant
  CollectionPeriod.belongsTo(Tenant, { foreignKey: 'tenant_id' });

  // Shift relationships
  Shift.belongsTo(User, { foreignKey: 'user_id' });

  // Charge relationships
  Charge.belongsTo(CollectionPeriod, { foreignKey: 'period_id' });
  Charge.belongsTo(Kiosk, { foreignKey: 'kiosk_id' });
  Charge.belongsTo(Merchant, { foreignKey: 'merchant_id' });
  Charge.belongsTo(FeeSchedule, { foreignKey: 'fee_id' });

  // Receipt relationships
  Receipt.belongsTo(User, { foreignKey: 'user_id' });
  Receipt.belongsTo(Shift, { foreignKey: 'shift_id' });

  // ReceiptCharge (n-n)
  Receipt.belongsToMany(Charge, { through: ReceiptCharge, foreignKey: 'receipt_id' });
  Charge.belongsToMany(Receipt, { through: ReceiptCharge, foreignKey: 'charge_id' });

  // AuditLog
  AuditLog.belongsTo(User, { foreignKey: 'user_id' });
};

defineAssociations();

module.exports = {
  sequelize,
  Tenant,
  Plan,
  PlanSubscription,
  Payment,
  Role,
  User,
  Market,
  Zone,
  KioskType,
  Kiosk,
  Merchant,
  KioskAssignment,
  FeeSchedule,
  FeeAssignment,
  CollectionPeriod,
  Shift,
  Charge,
  Receipt,
  ReceiptCharge,
  AuditLog
};