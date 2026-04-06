const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const auditLogModel = require("../models/auditLog.model");
const authService = require("../services/auth.service");
const userModel = require("../models/users.model");
const admin = require("../config/firebase");
const { auth } = require("firebase-admin");
const { logAudit } = require("../utils/audit");

const SALT_ROUNDS = 10;

//Đăng ký
exports.register = async (req, res, next) => {
    try{
        const result = await authService.register(req.body);

        await logAudit(req, {
          action: "REGISTER_USER",
          entity_type: "user",
          entity_id: result.user_id,
          newValue: {
            email: req.body.email,
            hoTen: req.body.hoTen
          },
        });
        
        res.status(201).json({
            message: "Register successfully",
            user_id: result.user_id
        });

    } catch (error) {
        next(error);
    }
};

//login
exports.login = async (req, res, next) => {
    try{
        const result = await authService.login(req.body);

        
        return res.json(result);
    } catch (error) {
        next(error);
    }
};


exports.googleLogin = async (req, res, next) => {
  try {
    const result = await authService.googleLogin(req.body);

    await logAudit(req, {
      action: "GOOGLE_LOGIN",
      entity_type: "user",
      entity_id: result.user_id,
      newValue: {
        provider: "google"
      },
    });

    return res.json(result);

  } catch (error) {
    next(error);
  }
};

exports.logout = async (req, res, next) => {
  try {
    const user = req.user;
    console.log("user", user);
    if(user.role === "super_admin") {
      await auditLogModel.createAuditLog({
                      tenant_id: null,
                      user_id: null,
                      hanhDong: "LOGOUT",
                      entity_type: "super_admin",
                      entity_id: user.id,
                      giaTriMoi: {
                        role: user.role,
                      },
                      super_admin_id: user.id,
                      merchant_id: null,
                    });
    } else if( user.role === "merchant") {
      await auditLogModel.createAuditLog({
                      tenant_id: user.tenant_id,
                      user_id: null,
                      hanhDong: "LOGOUT",
                      entity_type: "merchant",
                      entity_id: user.id,
                      giaTriMoi: {
                        role: user.role,
                      },
                      super_admin_id: null,
                      merchant_id: user.id,
                    });
    } else {
      await auditLogModel.createAuditLog({
                      tenant_id: user.tenant_id,
                      user_id: user.id,
                      hanhDong: "LOGOUT",
                      entity_type: "user",
                      entity_id: user.id,
                      giaTriMoi: {
                        role: user.role,
                      },
                      super_admin_id: null,
                      merchant_id: null,
                    });
    }

    

    return res.status(200).json({
      message: "Logout successful - please remove token on client",
    });

  } catch (error) {
    next(error);
  }
};