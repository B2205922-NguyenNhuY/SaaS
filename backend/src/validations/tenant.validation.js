const Joi = require('joi');

const createTenantSchema = Joi.object({
  tenBanQuanLy: Joi.string().max(150).required(),
  diaChi: Joi.string().max(255).optional(),
  soDienThoai: Joi.string().pattern(/^[0-9]{10,15}$/).required(),
  email: Joi.string().email().required(),
  matkhau: Joi.string().min(6).required()
});

const updateTenantSchema = Joi.object({
  tenBanQuanLy: Joi.string().max(150).optional(),
  diaChi: Joi.string().max(255).optional(),
  soDienThoai: Joi.string().pattern(/^[0-9]{10,15}$/).optional(),
  email: Joi.string().email().optional(),
  trangThai: Joi.string().valid('active', 'suspended').optional()
}).min(1);

module.exports = {
  createTenantSchema,
  updateTenantSchema
};