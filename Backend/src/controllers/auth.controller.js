const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const authService = require("../services/auth.service");
const userModel = require("../models/users.model");
const admin = require("../config/firebase");
const { auth } = require("firebase-admin");

const SALT_ROUNDS = 10;

//Đăng ký
exports.register = async (req, res, next) => {
    try{
        const result = await authService.register(req.body);

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


exports.googleLogin = async (req, res) => {
  try {
    const result = await authService.googleLogin(req.body);
    return res.json(result);

  } catch (error) {
    next(error);
  }
};

exports.logout = async (req, res) => {
  return res.status(200).json({
    message: "Logout successful - please remove token on client",
  });
};