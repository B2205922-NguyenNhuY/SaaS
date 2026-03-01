const Joi = require('joi');

const createPeriodSchema = Joi.object({
  tenKyThu: Joi.string().max(150).required(),
  ngayBatDau: Joi.date().iso().required(),
  ngayKetThuc: Joi.date().iso().greater(Joi.ref('ngayBatDau')).required(),
  loaiKy: Joi.string().valid('ngay', 'thang').required()
});

const createChargeSchema = Joi.object({
  period_id: Joi.number().integer().positive().required(),
  // Other fields will be auto-generated
});

const updateChargeStatusSchema = Joi.object({
  trangThai: Joi.string().valid('chua_thu', 'da_thu', 'no', 'mien').required(),
  ghiChu: Joi.string().max(255).optional()
});

module.exports = {
  createPeriodSchema,
  createChargeSchema,
  updateChargeStatusSchema
};