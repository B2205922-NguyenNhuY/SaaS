const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

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

        await logAudit(req, {
          action: "LOGIN",
          entity_type: "user",
          entity_id: result.user_id,
          newValue: {
            email: req.body.email
          },
        });
        
        return res.json(result);
    } catch (error) {
        next(error);
    }
};


exports.googleLogin = async (req, res) => {
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

exports.logout = async (req, res) => {
  try {

    await logAudit(req, {
      action: "LOGOUT",
      entity_type: "user",
      entity_id: req.user?.user_id || null,
    });

    return res.status(200).json({
      message: "Logout successful - please remove token on client",
    });

  } catch (error) {
    next(error);
  }
};